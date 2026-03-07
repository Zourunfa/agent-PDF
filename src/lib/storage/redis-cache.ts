/**
 * Upstash Redis cache for Vercel Serverless persistence
 * Stores PDF metadata, text content, and vector chunks
 */

import { PDFFile } from "@/types/pdf";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
// Vercel + Upstash integration provides these env vars
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const PDF_PREFIX = "pdf:";
const VECTOR_PREFIX = "vector:";
const PDF_LIST_KEY = "pdf:list";

/**
 * Store PDF metadata and content in Redis
 */
export async function setPDF(pdfId: string, pdf: PDFFile): Promise<void> {
  try {
    const key = `${PDF_PREFIX}${pdfId}`;
    
    // Serialize PDF data (exclude base64Data to save space)
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

    // Store PDF data with 7 day expiration
    await redis.set(key, JSON.stringify(data), { ex: 60 * 60 * 24 * 7 });

    // Add to PDF list
    await redis.sadd(PDF_LIST_KEY, pdfId);

    console.log(`[Redis] ✓ Stored PDF ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to store PDF ${pdfId}:`, error);
    throw error;
  }
}

/**
 * Get PDF from Redis
 */
export async function getPDF(pdfId: string): Promise<PDFFile | null> {
  try {
    const key = `${PDF_PREFIX}${pdfId}`;
    const data = await redis.get<string>(key);

    if (!data) {
      console.log(`[Redis] PDF ${pdfId} not found`);
      return null;
    }

    const parsed = JSON.parse(data);
    const pdf: PDFFile = {
      ...parsed,
      uploadedAt: new Date(parsed.uploadedAt),
    };

    console.log(`[Redis] ✓ Retrieved PDF ${pdfId}`);
    return pdf;
  } catch (error) {
    console.error(`[Redis] ✗ Failed to get PDF ${pdfId}:`, error);
    return null;
  }
}

/**
 * Get all PDF IDs from Redis
 */
export async function getAllPDFIds(): Promise<string[]> {
  try {
    const ids = await redis.smembers(PDF_LIST_KEY);
    console.log(`[Redis] ✓ Retrieved ${ids.length} PDF IDs`);
    return ids as string[];
  } catch (error) {
    console.error(`[Redis] ✗ Failed to get PDF list:`, error);
    return [];
  }
}

/**
 * Delete PDF from Redis
 */
export async function deletePDF(pdfId: string): Promise<void> {
  try {
    const key = `${PDF_PREFIX}${pdfId}`;
    await redis.del(key);
    await redis.srem(PDF_LIST_KEY, pdfId);
    console.log(`[Redis] ✓ Deleted PDF ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to delete PDF ${pdfId}:`, error);
  }
}

/**
 * Store vector chunks in Redis
 */
export async function setVectorChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<void> {
  try {
    const key = `${VECTOR_PREFIX}${pdfId}`;

    // Store chunks with 7 day expiration
    await redis.set(key, JSON.stringify(chunks), { ex: 60 * 60 * 24 * 7 });

    console.log(`[Redis] ✓ Stored ${chunks.length} vector chunks for ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to store vector chunks for ${pdfId}:`, error);
    throw error;
  }
}

/**
 * Store vector embeddings in Redis
 */
export async function setVectorEmbeddings(
  pdfId: string,
  embeddings: number[][]
): Promise<void> {
  try {
    const key = `${VECTOR_PREFIX}${pdfId}:embeddings`;

    // Store embeddings with 7 day expiration
    await redis.set(key, JSON.stringify(embeddings), { ex: 60 * 60 * 24 * 7 });

    console.log(`[Redis] ✓ Stored ${embeddings.length} vector embeddings for ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to store vector embeddings for ${pdfId}:`, error);
    throw error;
  }
}

/**
 * Get vector chunks from Redis
 */
export async function getVectorChunks(
  pdfId: string
): Promise<Array<{ content: string; metadata: Record<string, unknown> }> | null> {
  try {
    const key = `${VECTOR_PREFIX}${pdfId}`;
    const data = await redis.get<string>(key);

    if (!data) {
      console.log(`[Redis] Vector chunks for ${pdfId} not found`);
      return null;
    }

    const chunks = JSON.parse(data);
    console.log(`[Redis] ✓ Retrieved ${chunks.length} vector chunks for ${pdfId}`);
    return chunks;
  } catch (error) {
    console.error(`[Redis] ✗ Failed to get vector chunks for ${pdfId}:`, error);
    return null;
  }
}

/**
 * Get vector embeddings from Redis
 */
export async function getVectorEmbeddings(
  pdfId: string
): Promise<number[][] | null> {
  try {
    const key = `${VECTOR_PREFIX}${pdfId}:embeddings`;
    const data = await redis.get<string>(key);

    if (!data) {
      console.log(`[Redis] Vector embeddings for ${pdfId} not found`);
      return null;
    }

    const embeddings = JSON.parse(data);
    console.log(`[Redis] ✓ Retrieved ${embeddings.length} vector embeddings for ${pdfId}`);
    return embeddings;
  } catch (error) {
    console.error(`[Redis] ✗ Failed to get vector embeddings for ${pdfId}:`, error);
    return null;
  }
}

/**
 * Delete vector chunks from Redis
 */
export async function deleteVectorChunks(pdfId: string): Promise<void> {
  try {
    const key = `${VECTOR_PREFIX}${pdfId}`;
    const embeddingsKey = `${VECTOR_PREFIX}${pdfId}:embeddings`;
    await redis.del(key, embeddingsKey);
    console.log(`[Redis] ✓ Deleted vector chunks and embeddings for ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to delete vector chunks for ${pdfId}:`, error);
  }
}

/**
 * Check Redis connection
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    // @upstash/redis doesn't have a ping method, use a simple command instead
    await redis.set("__health_check__", "ok", { ex: 1 });
    console.log(`[Redis] ✓ Connection OK`);
    return true;
  } catch (error) {
    console.error(`[Redis] ✗ Connection failed:`, error);
    return false;
  }
}
