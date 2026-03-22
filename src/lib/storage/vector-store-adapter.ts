/**
 * Universal Vector Store Adapter
 * Supports both Pinecone (Vercel) and Qdrant (Docker/self-hosted)
 * Automatically switches based on environment configuration
 */

import { RecordMetadata } from '@pinecone-database/pinecone';
import { storeVectors as qdrantStoreVectors, searchVectors as qdrantSearchVectors, deleteVectors as qdrantDeleteVectors, getVectorCount as qdrantGetVectorCount, listPDFs as qdrantListPDFs, getStats as qdrantGetStats, ensureCollection } from '@/lib/qdrant/vector-store';

// Storage types
type VectorBackend = 'pinecone' | 'qdrant' | 'none';

// Configuration for Qdrant (Docker)
const QDRANT_URL = process.env.QDRANT_URL || '';

// Configuration for Pinecone (Vercel)
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';

// Determine which vector backend to use
function getVectorBackend(): VectorBackend {
  // Check if using Qdrant (Docker/self-hosted)
  if (QDRANT_URL) {
    console.log('[Vector Store] Using Qdrant (Docker/self-hosted)');
    return 'qdrant';
  }

  // Check if using Pinecone (Vercel)
  if (PINECONE_API_KEY) {
    console.log('[Vector Store] Using Pinecone (Vercel)');
    return 'pinecone';
  }

  console.log('[Vector Store] No vector store configured');
  return 'none';
}

// Export the backend type
export const vectorBackend = getVectorBackend();

// Check if vector store is configured
export const isVectorStoreConfigured = (): boolean => {
  return vectorBackend !== 'none';
};

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: RecordMetadata;
}

/**
 * Store vectors in the configured backend
 */
export async function storeVectors(
  pdfId: string,
  vectors: Array<VectorRecord>
): Promise<void> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    // Ensure collection exists before storing
    await ensureCollection();
    await qdrantStoreVectors(pdfId, vectors);
  } else if (backend === 'pinecone') {
    // Import Pinecone functions dynamically
    const { storeVectors: pineconeStoreVectors } = await import('@/lib/pinecone/vector-store');
    await pineconeStoreVectors(pdfId, vectors);
  } else {
    console.warn('[Vector Store] No backend configured, skipping vector storage');
  }
}

/**
 * Search for similar vectors
 */
export async function searchVectors(
  queryVector: number[],
  topK: number = 5,
  pdfId?: string
): Promise<Array<{ id: string; score: number; metadata?: RecordMetadata }>> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    return await qdrantSearchVectors(queryVector, topK, pdfId);
  } else if (backend === 'pinecone') {
    const { searchVectors: pineconeSearchVectors } = await import('@/lib/pinecone/vector-store');
    return await pineconeSearchVectors(queryVector, topK, pdfId);
  } else {
    console.warn('[Vector Store] No backend configured, returning empty results');
    return [];
  }
}

/**
 * Delete vectors for a PDF
 */
export async function deleteVectors(pdfId: string): Promise<void> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    await qdrantDeleteVectors(pdfId);
  } else if (backend === 'pinecone') {
    const { deleteVectors: pineconeDeleteVectors } = await import('@/lib/pinecone/vector-store');
    await pineconeDeleteVectors(pdfId);
  } else {
    console.warn('[Vector Store] No backend configured, skipping vector deletion');
  }
}

/**
 * Get vector count for a PDF
 */
export async function getVectorCount(pdfId: string): Promise<number> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    return await qdrantGetVectorCount(pdfId);
  } else if (backend === 'pinecone') {
    const { getVectorCount: pineconeGetVectorCount } = await import('@/lib/pinecone/vector-store');
    return await pineconeGetVectorCount(pdfId);
  } else {
    return 0;
  }
}

/**
 * List all PDFs in the vector store
 */
export async function listPDFs(): Promise<string[]> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    return await qdrantListPDFs();
  } else if (backend === 'pinecone') {
    const { listPDFs: pineconeListPDFs } = await import('@/lib/pinecone/vector-store');
    return await pineconeListPDFs();
  } else {
    return [];
  }
}

/**
 * Get collection statistics
 */
export async function getStats(): Promise<{
  totalVectors: number;
  pdfCount: number;
  collectionName: string;
} | null> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    return await qdrantGetStats();
  } else if (backend === 'pinecone') {
    const { getStats: pineconeGetStats } = await import('@/lib/pinecone/vector-store');
    return await pineconeGetStats();
  } else {
    return null;
  }
}

/**
 * Check vector store connection
 */
export async function checkVectorStoreConnection(): Promise<boolean> {
  const backend = getVectorBackend();

  if (backend === 'qdrant') {
    const { checkQdrantConnection } = await import('@/lib/qdrant/config');
    return await checkQdrantConnection();
  } else if (backend === 'pinecone') {
    const { getPineconeClient } = await import('@/lib/pinecone/config');
    try {
      const client = getPineconeClient();
      await client.listCollections();
      return true;
    } catch {
      return false;
    }
  } else {
    return false;
  }
}
