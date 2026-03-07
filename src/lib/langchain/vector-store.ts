/**
 * Vector store utilities using LangChain MemoryVectorStore
 */

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./config";

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
 */
export async function createVectorStore(
  pdfId: string,
  documents: Document[]
): Promise<MemoryVectorStore> {
  const cache = getVectorStoreCache();
  console.log(`[VectorStore] Creating vector store for ${pdfId} with ${documents.length} documents`);
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
  cache.set(pdfId, vectorStore);
  console.log(`[VectorStore] Vector store created successfully for ${pdfId}`);
  console.log(`[VectorStore] Cache now has ${cache.size} stores:`, Array.from(cache.keys()));
  return vectorStore;
}

/**
 * Create vector store from text chunks
 */
export async function createVectorStoreFromChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<MemoryVectorStore> {
  console.log(`[VectorStore] Creating vector store from ${chunks.length} chunks for ${pdfId}`);
  console.log(`[VectorStore] API Key check:`, {
    alibaba: !!process.env.ALIBABA_API_KEY,
    qwen: !!process.env.QWEN_API_KEY,
  });

  const documents = chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk.content,
        metadata: chunk.metadata,
      })
  );

  try {
    const vectorStore = await createVectorStore(pdfId, documents);
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
 */
export async function searchSimilarDocuments(
  pdfId: string,
  query: string,
  k: number = 4
): Promise<Document[]> {
  console.log(`[VectorStore] Searching for "${query}" in ${pdfId} (k=${k})`);
  const vectorStore = await getVectorStore(pdfId);

  if (!vectorStore) {
    console.warn(`[VectorStore] No vector store found for ${pdfId}. Available IDs:`, getVectorStoreIds());
    return [];
  }

  const results = await vectorStore.similaritySearchWithScore(query, k);
  console.log(`[VectorStore] Found ${results.length} results for query "${query}"`);
  
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
 */
export function clearVectorStore(pdfId: string): void {
  const cache = getVectorStoreCache();
  console.log(`[VectorStore] Clearing vector store for ${pdfId}`);
  cache.delete(pdfId);
}

/**
 * Clear all vector stores
 */
export function clearAllVectorStores(): void {
  const cache = getVectorStoreCache();
  console.log(`[VectorStore] Clearing all vector stores`);
  cache.clear();
}
