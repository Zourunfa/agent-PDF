/**
 * Vector store utilities using LangChain MemoryVectorStore + Pinecone
 * 
 * 架构：
 * - Pinecone: 持久化向量存储（跨实例共享）
 * - MemoryVectorStore: 内存缓存（单次请求快速访问）
 * - Redis: PDF 元数据和文本内容（不再存储向量）
 */

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./config";
import { getEmbeddings } from "./config";
import { 
  storePineconeVectors, 
  searchPineconeVectors, 
  deletePineconeVectors,
  hasPineconeVectors,
} from "@/lib/pinecone/vector-store";
import { isPineconeConfigured } from "@/lib/pinecone/config";

// Type for vector store data with embeddings
interface VectorStoreData {
  documents: Document[];
  embeddings: number[][];
}

/**
 * Global singleton for vector store cache
 * This ensures the cache persists across API route hot reloads in development
 */
declare global {
  var vectorStoreCache: Map<string, MemoryVectorStore> | undefined;
}

const getVectorStoreCache = (): Map<string, MemoryVectorStore> => {
  if (!global.vectorStoreCache) {
    console.log('[VectorStore] Initializing global vector store cache');
    global.vectorStoreCache = new Map<string, MemoryVectorStore>();
  }
  return global.vectorStoreCache;
};

/**
 * Get all vector store IDs for debugging
 */
export function getVectorStoreIds(): string[] {
  const cache = getVectorStoreCache();
  const ids = Array.from(cache.keys());
  console.log(`[VectorStore] getVectorStoreIds called, found: ${ids.length} stores`);
  return ids;
}

/**
 * Get or create vector store for a PDF
 */
export async function getVectorStore(pdfId: string): Promise<MemoryVectorStore | null> {
  const cache = getVectorStoreCache();
  const store = cache.get(pdfId);
  console.log(`[VectorStore] Get vector store for ${pdfId}:`, store ? "Found" : "Not found");
  console.log(`[VectorStore] Cache size: ${cache.size}, Keys:`, Array.from(cache.keys()));
  return store || null;
}

/**
 * Create vector store from documents
 * 
 * 新架构：
 * 1. 创建内存向量存储（快速访问）
 * 2. 如果配置了 Pinecone，存储到 Pinecone（持久化）
 * 3. 不再存储到 Redis（Redis 只存 PDF 元数据）
 */
export async function createVectorStore(
  pdfId: string,
  documents: Document[],
  storeToPinecone = true
): Promise<MemoryVectorStore> {
  const cache = getVectorStoreCache();
  console.log(`[VectorStore] Creating vector store for ${pdfId} with ${documents.length} documents`);
  
  // 1. 创建内存向量存储
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
  cache.set(pdfId, vectorStore);
  console.log(`[VectorStore] ✓ Vector store created in memory for ${pdfId}`);
  console.log(`[VectorStore] Cache now has ${cache.size} stores:`, Array.from(cache.keys()));

  // 2. 存储到 Pinecone（如果配置了）
  if (storeToPinecone && isPineconeConfigured) {
    try {
      await storePineconeVectors(pdfId, documents);
      console.log(`[VectorStore] ✓ Stored vectors to Pinecone for ${pdfId}`);
    } catch (error) {
      console.error(`[VectorStore] ✗ Failed to store to Pinecone:`, error);
      // 不抛出错误，继续使用内存存储
    }
  } else if (!isPineconeConfigured) {
    console.log(`[VectorStore] ⚠️ Pinecone not configured, using memory-only storage`);
  }

  return vectorStore;
}

/**
 * Create vector store from text chunks
 * 
 * 新架构：
 * 1. 存储 chunks 到 Redis（文本内容）
 * 2. 创建向量存储并存到 Pinecone（向量数据）
 * 3. 缓存到内存（快速访问）
 */
export async function createVectorStoreFromChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<MemoryVectorStore> {
  console.log(`[VectorStore] Creating vector store from ${chunks.length} chunks for ${pdfId}`);
  console.log(`[VectorStore] API Key check:`, {
    alibaba: !!process.env.ALIBABA_API_KEY,
    qwen: !!process.env.QWEN_API_KEY,
    pinecone: isPineconeConfigured,
  });

  const documents = chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk.content,
        metadata: chunk.metadata,
      })
  );

  try {
    // 1. 存储 chunks 到 Redis（只存文本，不存向量）
    try {
      const { setVectorChunks } = await import('@/lib/storage/redis-cache');
      await setVectorChunks(pdfId, chunks);
      console.log(`[VectorStore] ✓ Stored ${chunks.length} chunks to Redis`);
    } catch (redisError) {
      console.log(`[VectorStore] Redis not available for chunks, continuing...`);
    }

    // 2. 创建向量存储（会自动存到 Pinecone）
    const vectorStore = await createVectorStore(pdfId, documents, true);
    console.log(`[VectorStore] ✓ Successfully created and cached vector store`);

    return vectorStore;
  } catch (error) {
    console.error(`[VectorStore] ✗ Failed to create vector store:`, error);
    if (error instanceof Error) {
      console.error(`[VectorStore] Error message: ${error.message}`);
      if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("403")) {
        console.error(`[VectorStore] ⚠️ API Key issue detected! Please check your ALIBABA_API_KEY or QWEN_API_KEY`);
        console.error(`[VectorStore] Get free API key at: https://dashscope.aliyun.com/`);
      }
    }
    throw error;
  }
}

/**
 * Search similar documents
 * 
 * 新架构：
 * 1. 优先使用 Pinecone 搜索（持久化，跨实例）
 * 2. 如果 Pinecone 未配置，使用内存搜索
 * 3. 如果内存也没有，尝试从 Redis 恢复
 */
export async function searchSimilarDocuments(
  pdfId: string,
  query: string,
  k: number = 4
): Promise<Document[]> {
  console.log(`[VectorStore] Searching for "${query}" in ${pdfId} (k=${k})`);

  // 策略 1: 使用 Pinecone 搜索（推荐）
  if (isPineconeConfigured) {
    console.log(`[VectorStore] Using Pinecone for search...`);
    try {
      const results = await searchPineconeVectors(pdfId, query, k);
      if (results.length > 0) {
        console.log(`[VectorStore] ✓ Found ${results.length} results from Pinecone`);
        return results;
      }
      console.log(`[VectorStore] No results from Pinecone, trying fallback...`);
    } catch (error) {
      console.error(`[VectorStore] Pinecone search failed:`, error);
      console.log(`[VectorStore] Falling back to memory search...`);
    }
  }

  // 策略 2: 使用内存向量存储
  let vectorStore = await getVectorStore(pdfId);

  // 策略 3: 如果内存没有，尝试从 Redis 恢复
  if (!vectorStore) {
    console.log(`[VectorStore] Vector store not in memory, checking Redis...`);
    try {
      const { getVectorChunks } = await import('@/lib/storage/redis-cache');
      const chunks = await getVectorChunks(pdfId);

      if (chunks && chunks.length > 0) {
        console.log(`[VectorStore] ✓ Found ${chunks.length} chunks in Redis, recreating vector store...`);
        const documents = chunks.map(
          (chunk) =>
            new Document({
              pageContent: chunk.content,
              metadata: chunk.metadata,
            })
        );
        
        // 重新创建向量存储（不存到 Pinecone，因为应该已经存在）
        vectorStore = await createVectorStore(pdfId, documents, false);
        console.log(`[VectorStore] ✓ Vector store restored from Redis`);
      }
    } catch (redisError) {
      console.log(`[VectorStore] Redis not available or no chunks found:`, redisError);
    }
  }

  if (!vectorStore) {
    console.warn(`[VectorStore] No vector store found for ${pdfId}. Available IDs:`, getVectorStoreIds());
    return [];
  }

  // 使用内存向量存储搜索
  const results = await vectorStore.similaritySearchWithScore(query, k);
  console.log(`[VectorStore] Found ${results.length} results from memory store`);

  // Log scores for debugging
  results.forEach(([doc, score], idx) => {
    console.log(`[VectorStore] Result ${idx + 1}: score=${score.toFixed(4)}, preview="${doc.pageContent.substring(0, 50)}..."`);
  });

  // Lower threshold for better recall (0.3 instead of 0.5)
  // Note: Lower scores are better in some distance metrics
  const threshold = 0.3;
  const filteredResults = results.filter(([, score]) => score > threshold);

  if (filteredResults.length < results.length) {
    console.log(`[VectorStore] Filtered ${results.length - filteredResults.length} low-score results (threshold: ${threshold})`);
  }

  // If all results were filtered, return top results anyway
  if (filteredResults.length === 0 && results.length > 0) {
    console.log(`[VectorStore] All results filtered, returning top ${Math.min(2, results.length)} anyway`);
    return results.slice(0, Math.min(2, results.length)).map(([doc]) => doc);
  }

  return filteredResults.map(([doc]) => doc);
}

/**
 * Clear vector store for a PDF
 * 
 * 清理内存缓存和 Pinecone 中的向量数据
 */
export async function clearVectorStore(pdfId: string): Promise<void> {
  const cache = getVectorStoreCache();
  console.log(`[VectorStore] Clearing vector store for ${pdfId}`);
  
  // 1. 清理内存缓存
  cache.delete(pdfId);
  
  // 2. 清理 Pinecone
  if (isPineconeConfigured) {
    try {
      await deletePineconeVectors(pdfId);
      console.log(`[VectorStore] ✓ Deleted Pinecone vectors for ${pdfId}`);
    } catch (error) {
      console.error(`[VectorStore] ✗ Failed to delete Pinecone vectors:`, error);
    }
  }
}

/**
 * Clear all vector stores
 */
export function clearAllVectorStores(): void {
  const cache = getVectorStoreCache();
  console.log(`[VectorStore] Clearing all vector stores`);
  cache.clear();
}
