/**
 * Qdrant Vector Database Configuration
 *
 * Qdrant 是一个高性能的向量搜索引擎，支持自托管部署
 * 完全开源，可在 Docker 中运行，适合自托管场景
 */

import { QdrantClient } from '@qdrant/js-client-rest';

// Qdrant configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

// Collection name
const QDRANT_COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'pdf-chat';

// Vector configuration
const VECTOR_SIZE = 1536; // OpenAI text-embedding-ada-002 dimension size
const DISTANCE = 'Cosine'; // Distance metric: Cosine, Euclid, Dot

// Check if Qdrant is configured
export const isQdrantConfigured = !!QDRANT_URL;

// Log configuration status
if (isQdrantConfigured) {
  console.log('✓ Qdrant configured for vector storage');
  console.log(`  URL: ${QDRANT_URL}`);
  console.log(`  Collection: ${QDRANT_COLLECTION_NAME}`);
} else {
  console.warn('⚠️ Qdrant not configured');
  console.warn('⚠️ Set QDRANT_URL in environment variables');
  console.warn('⚠️ For Docker deployment: QDRANT_URL=http://qdrant:6333');
}

/**
 * Global Qdrant client singleton
 */
let qdrantClient: QdrantClient | null = null;

/**
 * Get Qdrant client instance
 */
export function getQdrantClient(): QdrantClient {
  if (!isQdrantConfigured) {
    throw new Error('QDRANT_NOT_CONFIGURED: Please set QDRANT_URL in environment variables');
  }

  if (!qdrantClient) {
    console.log('[Qdrant] Initializing client...');
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY || undefined,
    });
    console.log('[Qdrant] ✓ Client initialized');
  }

  return qdrantClient;
}

/**
 * Get collection name
 */
export function getCollectionName(): string {
  return QDRANT_COLLECTION_NAME;
}

/**
 * Get vector size
 */
export function getVectorSize(): number {
  return VECTOR_SIZE;
}

/**
 * Get distance metric
 */
export function getDistanceMetric(): string {
  return DISTANCE;
}

/**
 * Ensure collection exists
 */
export async function ensureCollection(): Promise<void> {
  try {
    const client = getQdrantClient();
    const collections = await client.getCollections();

    const exists = collections.collections.some(
      (c) => c.name === QDRANT_COLLECTION_NAME
    );

    if (!exists) {
      console.log(`[Qdrant] Creating collection: ${QDRANT_COLLECTION_NAME}`);

      await client.createCollection(QDRANT_COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: DISTANCE,
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });

      console.log('[Qdrant] ✓ Collection created');
    } else {
      console.log(`[Qdrant] ✓ Collection exists: ${QDRANT_COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error('[Qdrant] ✗ Failed to ensure collection:', error);
    throw error;
  }
}

/**
 * Get collection info
 */
export async function getCollectionInfo() {
  try {
    const client = getQdrantClient();
    const info = await client.getCollection(QDRANT_COLLECTION_NAME);
    return info;
  } catch (error) {
    console.error('[Qdrant] ✗ Failed to get collection info:', error);
    return null;
  }
}

/**
 * Delete collection
 */
export async function deleteCollection(): Promise<void> {
  try {
    const client = getQdrantClient();
    await client.deleteCollection(QDRANT_COLLECTION_NAME);
    console.log(`[Qdrant] ✓ Collection deleted: ${QDRANT_COLLECTION_NAME}`);
  } catch (error) {
    console.error('[Qdrant] ✗ Failed to delete collection:', error);
    throw error;
  }
}

/**
 * Check Qdrant connection
 */
export async function checkQdrantConnection(): Promise<boolean> {
  try {
    const client = getQdrantClient();
    const collections = await client.getCollections();
    console.log(`[Qdrant] ✓ Connection OK, found ${collections.collections.length} collections`);
    return true;
  } catch (error) {
    console.error('[Qdrant] ✗ Connection failed:', error);
    return false;
  }
}
