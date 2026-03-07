/**
 * Vector store utilities using LangChain MemoryVectorStore
 */

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { embeddings } from "./config";

/**
 * In-memory vector store cache (keyed by PDF ID)
 */
const vectorStoreCache = new Map<string, MemoryVectorStore>();

/**
 * Get or create vector store for a PDF
 */
export async function getVectorStore(pdfId: string): Promise<MemoryVectorStore | null> {
  return vectorStoreCache.get(pdfId) || null;
}

/**
 * Create vector store from documents
 */
export async function createVectorStore(
  pdfId: string,
  documents: Document[]
): Promise<MemoryVectorStore> {
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
  vectorStoreCache.set(pdfId, vectorStore);
  return vectorStore;
}

/**
 * Create vector store from text chunks
 */
export async function createVectorStoreFromChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<MemoryVectorStore> {
  const documents = chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk.content,
        metadata: chunk.metadata,
      })
  );

  return createVectorStore(pdfId, documents);
}

/**
 * Search similar documents
 */
export async function searchSimilarDocuments(
  pdfId: string,
  query: string,
  k: number = 4
): Promise<Document[]> {
  const vectorStore = await getVectorStore(pdfId);
  if (!vectorStore) {
    return [];
  }

  const results = await vectorStore.similaritySearchWithScore(query, k);
  return results.map(([doc]) => doc);
}

/**
 * Clear vector store for a PDF
 */
export function clearVectorStore(pdfId: string): void {
  vectorStoreCache.delete(pdfId);
}

/**
 * Clear all vector stores
 */
export function clearAllVectorStores(): void {
  vectorStoreCache.clear();
}
