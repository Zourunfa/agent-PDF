/**
 * Upstash Redis cache for Vercel Serverless persistence
 * Stores PDF metadata, text content, and vector chunks
 */

import { PDFFile } from "@/types/pdf";
import { kv } from "@vercel/kv";

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
    await kv.set(key, JSON.stringify(data), { ex: 60 * 60 * 24 * 7 });

    // Add to PDF list
    await kv.sadd(PDF_LIST_KEY, pdfId);

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
    const data = await kv.get<string>(key);

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
    const ids = await kv.smembers(PDF_LIST_KEY);
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
    await kv.del(key);
    await kv.srem(PDF_LIST_KEY, pdfId);
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
    await kv.set(key, JSON.stringify(chunks), { ex: 60 * 60 * 24 * 7 });

    console.log(`[Redis] ✓ Stored ${chunks.length} vector chunks for ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to store vector chunks for ${pdfId}:`, error);
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
    const data = await kv.get<string>(key);

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
 * Delete vector chunks from Redis
 */
export async function deleteVectorChunks(pdfId: string): Promise<void> {
  try {
    const key = `${VECTOR_PREFIX}${pdfId}`;
    await kv.del(key);
    console.log(`[Redis] ✓ Deleted vector chunks for ${pdfId}`);
  } catch (error) {
    console.error(`[Redis] ✗ Failed to delete vector chunks for ${pdfId}:`, error);
  }
}

/**
 * Check Redis connection
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await kv.ping();
    console.log(`[Redis] ✓ Connection OK`);
    return true;
  } catch (error) {
    console.error(`[Redis] ✗ Connection failed:`, error);
    return false;
  }
}
