/**
 * Universal Redis Adapter
 * Supports both Upstash Redis (Vercel) and traditional Redis (Docker/self-hosted)
 * Automatically switches based on environment configuration
 */

import { PDFFile } from '@/types/pdf';
import { Redis } from '@upstash/redis';
import Redis from 'ioredis';

// Storage types
type RedisBackend = 'upstash' | 'traditional' | 'none';

// Configuration for Upstash Redis (Vercel)
const UPSTASH_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

// Configuration for traditional Redis (Docker)
const TRADITIONAL_REDIS_URL = process.env.REDIS_URL || '';
const TRADITIONAL_REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Determine which Redis backend to use
function getRedisBackend(): RedisBackend {
  // Check if using traditional Redis (Docker/self-hosted)
  if (TRADITIONAL_REDIS_URL && TRADITIONAL_REDIS_URL.startsWith('redis://')) {
    console.log('[Redis Adapter] Using traditional Redis (Docker/self-hosted)');
    return 'traditional';
  }

  // Check if using Upstash Redis (Vercel)
  if (UPSTASH_URL && UPSTASH_TOKEN && UPSTASH_URL.startsWith('http')) {
    console.log('[Redis Adapter] Using Upstash Redis (Vercel)');
    return 'upstash';
  }

  console.log('[Redis Adapter] No Redis configured');
  return 'none';
}

// Export the backend type
export const redisBackend = getRedisBackend();

// Check if Redis is configured
export const isRedisConfigured = (): boolean => {
  return redisBackend !== 'none';
};

// Clients
let upstashClient: Redis | null = null;
let traditionalClient: Redis | null = null;

// Get Upstash Redis client
function getUpstashClient(): Redis | null {
  if (redisBackend !== 'upstash') {
    return null;
  }

  if (!upstashClient) {
    try {
      upstashClient = new Redis({
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
      });
      console.log('[Redis Adapter] ✓ Upstash client initialized');
    } catch (error) {
      console.error('[Redis Adapter] ✗ Failed to initialize Upstash client:', error);
      return null;
    }
  }

  return upstashClient;
}

// Get traditional Redis client
function getTraditionalClient(): Redis | null {
  if (redisBackend !== 'traditional') {
    return null;
  }

  if (!traditionalClient) {
    try {
      traditionalClient = new Redis(TRADITIONAL_REDIS_URL, {
        password: TRADITIONAL_REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      traditionalClient.on('connect', () => {
        console.log('[Redis Adapter] ✓ Traditional Redis connected');
      });

      traditionalClient.on('error', (error) => {
        console.error('[Redis Adapter] ✗ Traditional Redis error:', error);
      });

      console.log('[Redis Adapter] ✓ Traditional Redis client initialized');
    } catch (error) {
      console.error('[Redis Adapter] ✗ Failed to initialize traditional Redis client:', error);
      return null;
    }
  }

  return traditionalClient;
}

// Key prefixes
const PDF_PREFIX = 'pdf:';
const VECTOR_PREFIX = 'vector:';
const PDF_LIST_KEY = 'pdf:list';

/**
 * Store PDF metadata and content in Redis
 */
export async function setPDF(pdfId: string, pdf: PDFFile): Promise<void> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      console.warn(`[Redis Adapter] Skipped storing PDF ${pdfId} (Upstash not configured)`);
      return;
    }

    try {
      const key = `${PDF_PREFIX}${pdfId}`;
      const data = {
        id: pdf.id,
        fileName: pdf.fileName,
        sanitizedName: pdf.sanitizedName,
        fileSize: pdf.fileSize,
        mimeType: pdf.mimeType,
        uploadedAt: pdf.uploadedAt.toISOString(),
        parseStatus: pdf.parseStatus,
        textContent: pdf.textContent,
        pageCount: pdf.pageCount,
        tempPath: pdf.tempPath,
      };

      await redis.set(key, data, { ex: 60 * 60 * 24 * 7 });
      await redis.sadd(PDF_LIST_KEY, pdfId);

      console.log(`[Redis Adapter] ✓ Stored PDF ${pdfId} in Upstash`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to store PDF ${pdfId} in Upstash:`, error);
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      console.warn(`[Redis Adapter] Skipped storing PDF ${pdfId} (Traditional Redis not configured)`);
      return;
    }

    try {
      const key = `${PDF_PREFIX}${pdfId}`;
      const data = JSON.stringify({
        id: pdf.id,
        fileName: pdf.fileName,
        sanitizedName: pdf.sanitizedName,
        fileSize: pdf.fileSize,
        mimeType: pdf.mimeType,
        uploadedAt: pdf.uploadedAt.toISOString(),
        parseStatus: pdf.parseStatus,
        textContent: pdf.textContent,
        pageCount: pdf.pageCount,
        tempPath: pdf.tempPath,
      });

      await redis.setex(key, 60 * 60 * 24 * 7, data);
      await redis.sadd(PDF_LIST_KEY, pdfId);

      console.log(`[Redis Adapter] ✓ Stored PDF ${pdfId} in traditional Redis`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to store PDF ${pdfId} in traditional Redis:`, error);
    }
  }
}

/**
 * Get PDF from Redis
 */
export async function getPDF(pdfId: string): Promise<PDFFile | null> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return null;
    }

    try {
      const key = `${PDF_PREFIX}${pdfId}`;
      const data = await redis.get(key);

      if (!data) {
        console.log(`[Redis Adapter] PDF ${pdfId} not found in Upstash`);
        return null;
      }

      const parsed = data as any;
      const pdf: PDFFile = {
        ...parsed,
        uploadedAt: new Date(parsed.uploadedAt),
      };

      console.log(`[Redis Adapter] ✓ Retrieved PDF ${pdfId} from Upstash`);
      return pdf;
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to get PDF ${pdfId} from Upstash:`, error);
      return null;
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return null;
    }

    try {
      const key = `${PDF_PREFIX}${pdfId}`;
      const data = await redis.get(key);

      if (!data) {
        console.log(`[Redis Adapter] PDF ${pdfId} not found in traditional Redis`);
        return null;
      }

      const parsed = JSON.parse(data as string);
      const pdf: PDFFile = {
        ...parsed,
        uploadedAt: new Date(parsed.uploadedAt),
      };

      console.log(`[Redis Adapter] ✓ Retrieved PDF ${pdfId} from traditional Redis`);
      return pdf;
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to get PDF ${pdfId} from traditional Redis:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Get all PDF IDs from Redis
 */
export async function getAllPDFIds(): Promise<string[]> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return [];
    }

    try {
      const ids = await redis.smembers(PDF_LIST_KEY);
      console.log(`[Redis Adapter] ✓ Retrieved ${ids.length} PDF IDs from Upstash`);
      return ids as string[];
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to get PDF list from Upstash:`, error);
      return [];
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return [];
    }

    try {
      const ids = await redis.smembers(PDF_LIST_KEY);
      console.log(`[Redis Adapter] ✓ Retrieved ${ids.length} PDF IDs from traditional Redis`);
      return ids as string[];
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to get PDF list from traditional Redis:`, error);
      return [];
    }
  }

  return [];
}

/**
 * Delete PDF from Redis
 */
export async function deletePDF(pdfId: string): Promise<void> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return;
    }

    try {
      const key = `${PDF_PREFIX}${pdfId}`;
      await redis.del(key);
      await redis.srem(PDF_LIST_KEY, pdfId);
      console.log(`[Redis Adapter] ✓ Deleted PDF ${pdfId} from Upstash`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to delete PDF ${pdfId} from Upstash:`, error);
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return;
    }

    try {
      const key = `${PDF_PREFIX}${pdfId}`;
      await redis.del(key);
      await redis.srem(PDF_LIST_KEY, pdfId);
      console.log(`[Redis Adapter] ✓ Deleted PDF ${pdfId} from traditional Redis`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to delete PDF ${pdfId} from traditional Redis:`, error);
    }
  }
}

/**
 * Check Redis connection
 */
export async function checkRedisConnection(): Promise<boolean> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return false;
    }

    try {
      await redis.set('__health_check__', 'ok', { ex: 1 });
      console.log('[Redis Adapter] ✓ Upstash connection OK');
      return true;
    } catch (error) {
      console.error('[Redis Adapter] ✗ Upstash connection failed:', error);
      return false;
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return false;
    }

    try {
      await redis.ping();
      console.log('[Redis Adapter] ✓ Traditional Redis connection OK');
      return true;
    } catch (error) {
      console.error('[Redis Adapter] ✗ Traditional Redis connection failed:', error);
      return false;
    }
  }

  return false;
}

/**
 * Store vector chunks in Redis
 */
export async function setVectorChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<void> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return;
    }

    try {
      const key = `${VECTOR_PREFIX}${pdfId}`;
      await redis.set(key, chunks, { ex: 60 * 60 * 24 * 7 });
      console.log(`[Redis Adapter] ✓ Stored ${chunks.length} vector chunks for ${pdfId} in Upstash`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to store vector chunks for ${pdfId} in Upstash:`, error);
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return;
    }

    try {
      const key = `${VECTOR_PREFIX}${pdfId}`;
      await redis.setex(key, 60 * 60 * 24 * 7, JSON.stringify(chunks));
      console.log(`[Redis Adapter] ✓ Stored ${chunks.length} vector chunks for ${pdfId} in traditional Redis`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to store vector chunks for ${pdfId} in traditional Redis:`, error);
    }
  }
}

/**
 * Get vector chunks from Redis
 */
export async function getVectorChunks(
  pdfId: string
): Promise<Array<{ content: string; metadata: Record<string, unknown> }> | null> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return null;
    }

    try {
      const key = `${VECTOR_PREFIX}${pdfId}`;
      const data = await redis.get(key);

      if (!data) {
        return null;
      }

      const chunks = data as Array<{ content: string; metadata: Record<string, unknown> }>;
      console.log(`[Redis Adapter] ✓ Retrieved ${chunks.length} vector chunks for ${pdfId} from Upstash`);
      return chunks;
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to get vector chunks for ${pdfId} from Upstash:`, error);
      return null;
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return null;
    }

    try {
      const key = `${VECTOR_PREFIX}${pdfId}`;
      const data = await redis.get(key);

      if (!data) {
        return null;
      }

      const chunks = JSON.parse(data as string);
      console.log(`[Redis Adapter] ✓ Retrieved ${chunks.length} vector chunks for ${pdfId} from traditional Redis`);
      return chunks;
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to get vector chunks for ${pdfId} from traditional Redis:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Delete vector chunks from Redis
 */
export async function deleteVectorChunks(pdfId: string): Promise<void> {
  const backend = getRedisBackend();

  if (backend === 'upstash') {
    const redis = getUpstashClient();
    if (!redis) {
      return;
    }

    try {
      const key = `${VECTOR_PREFIX}${pdfId}`;
      const embeddingsKey = `${VECTOR_PREFIX}${pdfId}:embeddings`;
      await redis.del(key, embeddingsKey);
      console.log(`[Redis Adapter] ✓ Deleted vector chunks for ${pdfId} from Upstash`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to delete vector chunks for ${pdfId} from Upstash:`, error);
    }
  } else if (backend === 'traditional') {
    const redis = getTraditionalClient();
    if (!redis) {
      return;
    }

    try {
      const key = `${VECTOR_PREFIX}${pdfId}`;
      const embeddingsKey = `${VECTOR_PREFIX}${pdfId}:embeddings`;
      await redis.del(key, embeddingsKey);
      console.log(`[Redis Adapter] ✓ Deleted vector chunks for ${pdfId} from traditional Redis`);
    } catch (error) {
      console.error(`[Redis Adapter] ✗ Failed to delete vector chunks for ${pdfId} from traditional Redis:`, error);
    }
  }
}
