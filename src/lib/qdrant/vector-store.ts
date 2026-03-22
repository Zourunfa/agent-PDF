/**
 * Qdrant Vector Store
 * Provides vector storage and similarity search using Qdrant
 * Compatible interface with Pinecone for easy migration
 */

import { getQdrantClient, ensureCollection, getCollectionName } from './config';
import { RecordMetadata } from '@pinecone-database/pinecone';

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: RecordMetadata;
}

/**
 * Store vectors in Qdrant
 */
export async function storeVectors(
  pdfId: string,
  vectors: Array<{ id: string; values: number[]; metadata?: RecordMetadata }>
): Promise<void> {
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    // Ensure collection exists
    await ensureCollection();

    console.log(`[Qdrant] Storing ${vectors.length} vectors for PDF ${pdfId}`);

    // Prepare points for insertion
    const points = vectors.map((vector) => ({
      id: vector.id,
      vector: vector.values,
      payload: {
        ...vector.metadata,
        pdfId,
        timestamp: new Date().toISOString(),
      },
    }));

    // Insert vectors in batches
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await client.upsert(collectionName, {
        points: batch,
      });
      console.log(`[Qdrant] ✓ Inserted batch ${i / batchSize + 1}/${Math.ceil(points.length / batchSize)}`);
    }

    console.log(`[Qdrant] ✓ Stored ${vectors.length} vectors for PDF ${pdfId}`);
  } catch (error) {
    console.error(`[Qdrant] ✗ Failed to store vectors for PDF ${pdfId}:`, error);
    throw error;
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
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    console.log(`[Qdrant] Searching for top ${topK} similar vectors`);

    // Build filter for PDF ID if provided
    const filter = pdfId
      ? {
          filter: {
            must: [
              {
                key: 'pdfId',
                match: {
                  value: pdfId,
                },
              },
            ],
          },
        }
      : undefined;

    // Search for similar vectors
    const results = await client.search(collectionName, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
      ...filter,
    });

    console.log(`[Qdrant] ✓ Found ${results.length} results`);

    // Format results
    return results.map((result) => ({
      id: result.id as string,
      score: result.score || 0,
      metadata: result.payload as RecordMetadata,
    }));
  } catch (error) {
    console.error('[Qdrant] ✗ Search failed:', error);
    throw error;
  }
}

/**
 * Delete vectors for a PDF
 */
export async function deleteVectors(pdfId: string): Promise<void> {
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    console.log(`[Qdrant] Deleting vectors for PDF ${pdfId}`);

    // Delete vectors by filter
    await client.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'pdfId',
            match: {
              value: pdfId,
            },
          },
        ],
      },
    });

    console.log(`[Qdrant] ✓ Deleted vectors for PDF ${pdfId}`);
  } catch (error) {
    console.error(`[Qdrant] ✗ Failed to delete vectors for PDF ${pdfId}:`, error);
    throw error;
  }
}

/**
 * Get vector count for a PDF
 */
export async function getVectorCount(pdfId: string): Promise<number> {
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    const result = await client.count(collectionName, {
      filter: {
        must: [
          {
            key: 'pdfId',
            match: {
              value: pdfId,
            },
          },
        ],
      },
    });

    return result.count || 0;
  } catch (error) {
    console.error(`[Qdrant] ✗ Failed to count vectors for PDF ${pdfId}:`, error);
    return 0;
  }
}

/**
 * List all PDFs in the vector store
 */
export async function listPDFs(): Promise<string[]> {
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    // Scroll through all points to get unique PDF IDs
    const pdfIds = new Set<string>();
    let offset: any = null;

    do {
      const result = await client.scroll(collectionName, {
        limit: 100,
        offset,
        with_payload: ['pdfId'],
      });

      result.points.forEach((point) => {
        if (point.payload?.pdfId) {
          pdfIds.add(point.payload.pdfId as string);
        }
      });

      offset = result.next_page_offset;
    } while (offset);

    return Array.from(pdfIds);
  } catch (error) {
    console.error('[Qdrant] ✗ Failed to list PDFs:', error);
    return [];
  }
}

/**
 * Clear all vectors (use with caution!)
 */
export async function clearAllVectors(): Promise<void> {
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    console.log('[Qdrant] ⚠️ Deleting all vectors');

    await client.deleteCollection(collectionName);
    await ensureCollection();

    console.log('[Qdrant] ✓ Cleared all vectors');
  } catch (error) {
    console.error('[Qdrant] ✗ Failed to clear vectors:', error);
    throw error;
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
  try {
    const client = getQdrantClient();
    const collectionName = getCollectionName();

    const collectionInfo = await client.getCollection(collectionName);
    const pdfIds = await listPDFs();

    return {
      totalVectors: collectionInfo.points_count || 0,
      pdfCount: pdfIds.length,
      collectionName,
    };
  } catch (error) {
    console.error('[Qdrant] ✗ Failed to get stats:', error);
    return null;
  }
}
