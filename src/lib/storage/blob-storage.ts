/**
 * Vercel Blob Storage for PDF files
 * Provides persistent storage across serverless function instances
 */

import { put, head, del } from '@vercel/blob';

/**
 * Upload PDF to Vercel Blob Storage
 */
export async function uploadPDFToBlob(pdfId: string, buffer: Buffer, fileName: string): Promise<string> {
  try {
    console.log(`[Blob Storage] Uploading PDF ${pdfId} to Vercel Blob...`);
    
    const blob = await put(`pdfs/${pdfId}.pdf`, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log(`[Blob Storage] ✓ Uploaded to: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`[Blob Storage] ✗ Upload failed:`, error);
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
