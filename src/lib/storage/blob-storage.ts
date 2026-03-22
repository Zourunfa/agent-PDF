/**
 * Vercel Blob Storage for PDF files
 * Provides persistent storage across serverless function instances
 */

import { put, head, del, get } from '@vercel/blob';

/**
 * Check Blob Storage configuration
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
 * Upload PDF to Vercel Blob Storage
 */
export async function uploadPDFToBlob(pdfId: string, buffer: Buffer, fileName: string): Promise<string> {
  // Check configuration
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
 * Check if PDF exists in Blob Storage
 */
export async function checkPDFInBlob(pdfId: string): Promise<boolean> {
  try {
    const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL}/pdfs/${pdfId}.pdf`;
    await head(blobUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete PDF from Blob Storage
 */
export async function deletePDFFromBlob(pdfId: string): Promise<void> {
  try {
    const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL}/pdfs/${pdfId}.pdf`;
    await del(blobUrl);
    console.log(`[Blob Storage] ✓ Deleted PDF ${pdfId}`);
  } catch (error) {
    console.error(`[Blob Storage] ✗ Delete failed:`, error);
  }
}

/**
 * Get PDF URL from Blob Storage
 */
export function getPDFBlobUrl(pdfId: string): string {
  return `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL}/pdfs/${pdfId}.pdf`;
}

/**
 * Download PDF from Vercel Blob Storage (for private access)
 */
export async function downloadPDFFromBlob(blobUrl: string): Promise<Buffer> {
  try {
    console.log(`[Blob Storage] Downloading from: ${blobUrl}`);

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
 * Check if URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.includes('.blob.vercel-storage.com') ||
         url.includes('public.blob.vercel-storage.com') ||
         url.includes('private.blob.vercel-storage.com');
}
