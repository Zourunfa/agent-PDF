/**
 * PDF file storage with filesystem persistence
 * Stores metadata in memory and text content in /tmp for Vercel compatibility
 */

import { PDFFile } from "@/types/pdf";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const pdfFiles = new Map<string, PDFFile>();

// Get persistent storage directory
const getStorageDir = () => {
  return process.env.VERCEL 
    ? path.join('/tmp', 'pdf-storage')
    : path.join(os.tmpdir(), 'pdf-storage');
};

// Ensure storage directory exists
async function ensureStorageDir() {
  const dir = getStorageDir();
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('[PDF Storage] Failed to create storage directory:', error);
  }
}

// Get text content file path
function getTextContentPath(pdfId: string): string {
  return path.join(getStorageDir(), `${pdfId}.txt`);
}

// Get metadata file path
function getMetadataPath(pdfId: string): string {
  return path.join(getStorageDir(), `${pdfId}.json`);
}

/**
 * Add a PDF file to storage (with persistence)
 */
export async function addPDFFile(pdf: PDFFile): Promise<void> {
  pdfFiles.set(pdf.id, pdf);
  
  // Persist to filesystem
  try {
    await ensureStorageDir();
    
    // Save text content
    if (pdf.textContent) {
      await fs.writeFile(getTextContentPath(pdf.id), pdf.textContent, 'utf-8');
    }
    
    // Save metadata
    const metadata = {
      id: pdf.id,
      fileName: pdf.fileName,
      sanitizedName: pdf.sanitizedName,
      fileSize: pdf.fileSize,
      mimeType: pdf.mimeType,
      uploadedAt: pdf.uploadedAt.toISOString(),
      parseStatus: pdf.parseStatus,
      pageCount: pdf.pageCount,
      tempPath: pdf.tempPath,
    };
    await fs.writeFile(getMetadataPath(pdf.id), JSON.stringify(metadata), 'utf-8');
    
    console.log(`[PDF Storage] ✓ Persisted PDF ${pdf.id} to filesystem`);
  } catch (error) {
    console.error(`[PDF Storage] ✗ Failed to persist PDF ${pdf.id}:`, error);
  }
}

/**
 * Get a PDF file by ID (with filesystem fallback)
 */
export async function getPDFFile(id: string): Promise<PDFFile | undefined> {
  // Try memory first
  let pdf = pdfFiles.get(id);
  if (pdf) {
    return pdf;
  }
  
  // Try filesystem
  try {
    console.log(`[PDF Storage] PDF ${id} not in memory, checking filesystem...`);
    
    const metadataPath = getMetadataPath(id);
    const textPath = getTextContentPath(id);
    
    // Read metadata
    const metadataStr = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataStr);
    
    // Read text content
    let textContent: string | null = null;
    try {
      textContent = await fs.readFile(textPath, 'utf-8');
    } catch {
      // Text content might not exist yet
    }
    
    // Reconstruct PDF object
    pdf = {
      ...metadata,
      uploadedAt: new Date(metadata.uploadedAt),
      textContent,
    } as PDFFile;
    
    // Cache in memory
    pdfFiles.set(id, pdf);
    console.log(`[PDF Storage] ✓ Loaded PDF ${id} from filesystem`);
    
    return pdf;
  } catch (error) {
    console.error(`[PDF Storage] ✗ Failed to load PDF ${id} from filesystem:`, error);
    return undefined;
  }
}

/**
 * Get all PDF files
 */
export function getAllPDFFiles(): PDFFile[] {
  return Array.from(pdfFiles.values());
}

/**
 * Remove a PDF file
 */
export async function removePDFFile(id: string): Promise<boolean> {
  const deleted = pdfFiles.delete(id);
  
  // Also remove from filesystem
  try {
    await fs.unlink(getTextContentPath(id));
    await fs.unlink(getMetadataPath(id));
    console.log(`[PDF Storage] ✓ Removed PDF ${id} from filesystem`);
  } catch (error) {
    // Files might not exist
  }
  
  return deleted;
}

/**
 * Clear all PDF files
 */
export function clearAllPDFFiles(): void {
  pdfFiles.clear();
}
