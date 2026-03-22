/**
 * File Storage Abstraction Layer
 * Supports both Vercel Blob Storage (cloud) and local filesystem (Docker/self-hosted)
 * Automatically switches based on environment configuration
 */

import { put, head, del, get } from '@vercel/blob';
import { getFileStorage } from './adapters/file-storage-adapter';

/**
 * Check which storage backend to use
 * - Local filesystem: when STORAGE_PATH is set (Docker/self-hosted)
 * - Vercel Blob: when BLOB_READ_WRITE_TOKEN is set (Vercel deployment)
 */
function getStorageType(): 'local' | 'vercel-blob' {
  // Check if using local storage (Docker/self-hosted)
  if (process.env.STORAGE_PATH) {
    console.log('[Blob Storage] Using local filesystem storage');
    return 'local';
  }

  // Check if using Vercel Blob Storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('[Blob Storage] Using Vercel Blob Storage');
    return 'vercel-blob';
  }

  // Default to local storage for development
  console.log('[Blob Storage] No storage configured, defaulting to local filesystem');
  return 'local';
}

/**
 * Get the storage type for the current environment
 */
export function getStorageBackend(): 'local' | 'vercel-blob' {
  return getStorageType();
}

/**
 * Check Blob Storage configuration (for Vercel deployment)
 */
function checkBlobConfig(): { configured: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    issues.push('BLOB_READ_WRITE_TOKEN 未设置');
  }

  if (!process.env.VERCEL_URL) {
    issues.push('VERCEL_URL 未设置（本地开发应为 http://localhost:3000）');
  }

  return {
    configured: issues.length === 0,
    issues,
  };
}

/**
 * Upload PDF to storage backend (Vercel Blob or local filesystem)
 */
export async function uploadPDFToBlob(pdfId: string, buffer: Buffer, fileName: string): Promise<string> {
  const storageType = getStorageType();

  // Use local filesystem storage
  if (storageType === 'local') {
    console.log(`[Blob Storage] Uploading PDF ${pdfId} to local filesystem...`);
    try {
      const storage = getFileStorage();
      const url = await storage.upload(pdfId, buffer, fileName);
      console.log(`[Blob Storage] ✓ Uploaded to: ${url}`);
      return url;
    } catch (error) {
      console.error(`[Blob Storage] ✗ Local upload failed:`, error);
      throw error;
    }
  }

  // Use Vercel Blob Storage
  const config = checkBlobConfig();
  if (!config.configured) {
    throw new Error(`Blob Storage 配置不完整: ${config.issues.join(', ')}`);
  }

  try {
    console.log(`[Blob Storage] Uploading PDF ${pdfId} to Vercel Blob...`);
    console.log(`[Blob Storage] Environment: ${process.env.VERCEL_ENV || 'unknown'}`);
    console.log(`[Blob Storage] Vercel URL: ${process.env.VERCEL_URL}`);
    console.log(`[Blob Storage] Token prefix: ${process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20)}...`);

    const blob = await put(`pdfs/${pdfId}.pdf`, buffer, {
      access: 'private',
      addRandomSuffix: false,
    });

    console.log(`[Blob Storage] ✓ Uploaded to: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`[Blob Storage] ✗ Upload failed:`, error);
    console.error(`[Blob Storage] Error details:`, {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

/**
 * Check if PDF exists in storage
 */
export async function checkPDFInBlob(pdfId: string): Promise<boolean> {
  const storageType = getStorageType();

  // Use local filesystem storage
  if (storageType === 'local') {
    try {
      const storage = getFileStorage();
      return await storage.exists(pdfId);
    } catch {
      return false;
    }
  }

  // Use Vercel Blob Storage
  try {
    const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL}/pdfs/${pdfId}.pdf`;
    await head(blobUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete PDF from storage
 */
export async function deletePDFFromBlob(pdfId: string): Promise<void> {
  const storageType = getStorageType();

  // Use local filesystem storage
  if (storageType === 'local') {
    try {
      const storage = getFileStorage();
      await storage.delete(pdfId);
      console.log(`[Blob Storage] ✓ Deleted PDF ${pdfId} from local filesystem`);
    } catch (error) {
      console.error(`[Blob Storage] ✗ Delete failed:`, error);
    }
    return;
  }

  // Use Vercel Blob Storage
  try {
    const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL}/pdfs/${pdfId}.pdf`;
    await del(blobUrl);
    console.log(`[Blob Storage] ✓ Deleted PDF ${pdfId}`);
  } catch (error) {
    console.error(`[Blob Storage] ✗ Delete failed:`, error);
  }
}

/**
 * Get PDF URL from storage
 */
export function getPDFBlobUrl(pdfId: string): string {
  const storageType = getStorageType();

  // Use local filesystem storage
  if (storageType === 'local') {
    const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_URL || '/uploads';
    return `${baseUrl}/${pdfId}.pdf`;
  }

  // Use Vercel Blob Storage
  return `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL}/pdfs/${pdfId}.pdf`;
}

/**
 * Download PDF from storage (for private access)
 */
export async function downloadPDFFromBlob(blobUrl: string): Promise<Buffer> {
  const storageType = getStorageType();

  // Use local filesystem storage
  if (storageType === 'local') {
    try {
      console.log(`[Blob Storage] Downloading from local filesystem...`);

      // Extract PDF ID from URL or use the URL directly
      const storage = getFileStorage();

      // Try to extract ID from URL path
      const urlParts = blobUrl.split('/');
      const pdfId = urlParts[urlParts.length - 1].replace('.pdf', '');

      const buffer = await storage.download(pdfId);
      console.log(`[Blob Storage] ✓ Downloaded ${buffer.length} bytes from local filesystem`);
      return buffer;
    } catch (error) {
      console.error(`[Blob Storage] ✗ Local download failed:`, error);
      throw error;
    }
  }

  // Use Vercel Blob Storage
  try {
    console.log(`[Blob Storage] Downloading from Vercel Blob: ${blobUrl}`);

    const result = await get(blobUrl, { access: 'private' });

    if (!result) {
      throw new Error('Blob not found');
    }

    // Read stream to buffer
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    console.log(`[Blob Storage] ✓ Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error(`[Blob Storage] ✗ Download failed:`, error);
    throw error;
  }
}

/**
 * Check if URL is a storage URL (Vercel Blob or local)
 */
export function isBlobUrl(url: string): boolean {
  return url.includes('.blob.vercel-storage.com') ||
         url.includes('public.blob.vercel-storage.com') ||
         url.includes('private.blob.vercel-storage.com') ||
         url.includes('/uploads/');
}
