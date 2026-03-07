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

  // Persist to Redis (primary storage for Vercel)
  try {
    const { setPDF } = await import('./redis-cache');
    await setPDF(pdf.id, pdf);
    console.log(`[PDF Storage] ✓ Persisted PDF ${pdf.id} to Redis`);
  } catch (redisError) {
    const errorMsg = redisError instanceof Error ? redisError.message : String(redisError);
    console.error(`[PDF Storage] ⚠️ Redis failed: ${errorMsg}`);
    console.log(`[PDF Storage] Using filesystem fallback...`);

    // Fallback: Persist to filesystem
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
}

/**
 * Get a PDF file by ID (with Redis and filesystem fallback)
 */
export async function getPDFFile(id: string): Promise<PDFFile | undefined> {
  // Try memory first
  let pdf = pdfFiles.get(id);
  if (pdf) {
    return pdf;
  }

  console.log(`[PDF Storage] PDF ${id} not in memory, checking Redis...`);

  // Try Redis (primary storage for Vercel)
  try {
    const { getPDF } = await import('./redis-cache');
    const redisPdf = await getPDF(id);
    if (redisPdf) {
      // Cache in memory
      pdfFiles.set(id, redisPdf);
      console.log(`[PDF Storage] ✓ Loaded PDF ${id} from Redis`);
      return redisPdf;
    }
  } catch (redisError) {
    console.log(`[PDF Storage] Redis failed, checking filesystem:`, redisError);
  }

  // Fallback: Try filesystem
  try {
    const metadataPath = getMetadataPath(id);
    const textPath = getTextContentPath(id);

    // Check if files exist
    try {
      await fs.access(metadataPath);
      console.log(`[PDF Storage] ✓ Metadata file exists`);
    } catch {
      console.log(`[PDF Storage] ✗ Metadata file not found: ${metadataPath}`);
      return undefined;
    }

    // Read metadata
    const metadataStr = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataStr);
    console.log(`[PDF Storage] ✓ Metadata loaded:`, {
      id: metadata.id,
      fileName: metadata.fileName,
      parseStatus: metadata.parseStatus,
    });

    // Read text content
    let textContent: string | null = null;
    try {
      await fs.access(textPath);
      textContent = await fs.readFile(textPath, 'utf-8');
      console.log(`[PDF Storage] ✓ Text content loaded: ${textContent.length} chars`);
    } catch {
      console.log(`[PDF Storage] ⚠️ Text content file not found: ${textPath}`);
    }

    // Reconstruct PDF object
    const filesystemPdf = {
      ...metadata,
      uploadedAt: new Date(metadata.uploadedAt),
      textContent,
    } as PDFFile;

    // Cache in memory
    pdfFiles.set(id, filesystemPdf);
    console.log(`[PDF Storage] ✓ Loaded PDF ${id} from filesystem`);

    return filesystemPdf;
  } catch (error) {
    console.error(`[PDF Storage] ✗ Failed to load PDF ${id} from filesystem:`, error);
    return undefined;
  }
}

/**
 * Get all PDF files (with Redis and filesystem scan)
 */
export async function getAllPDFFiles(): Promise<PDFFile[]> {
  // If memory has data, return it
  if (pdfFiles.size > 0) {
    return Array.from(pdfFiles.values());
  }

  console.log('[PDF Storage] Memory empty, checking Redis...');

  // Try to load from Redis first
  try {
    const { getAllPDFIds, getPDF } = await import('./redis-cache');
    const ids = await getAllPDFIds();
    
    if (ids.length > 0) {
      console.log(`[PDF Storage] Found ${ids.length} PDFs in Redis, loading...`);
      
      for (const id of ids) {
        const pdf = await getPDF(id);
        if (pdf) {
          pdfFiles.set(id, pdf);
        }
      }
      
      console.log(`[PDF Storage] ✓ Loaded ${pdfFiles.size} PDFs from Redis`);
      return Array.from(pdfFiles.values());
    }
  } catch (redisError) {
    console.log('[PDF Storage] Redis failed, scanning filesystem:', redisError);
  }

  // Fallback: scan filesystem
  await loadAllPDFsFromFilesystem();
  return Array.from(pdfFiles.values());
}

/**
 * Load all PDFs from filesystem into memory
 */
async function loadAllPDFsFromFilesystem(): Promise<void> {
  try {
    const storageDir = getStorageDir();
    await ensureStorageDir();
    
    const files = await fs.readdir(storageDir);
    const metadataFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`[PDF Storage] Found ${metadataFiles.length} metadata files`);
    
    for (const file of metadataFiles) {
      const pdfId = file.replace('.json', '');
      
      // Skip if already in memory
      if (pdfFiles.has(pdfId)) {
        continue;
      }
      
      try {
        const metadataPath = getMetadataPath(pdfId);
        const metadataStr = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataStr);
        
        // Read text content if exists
        let textContent: string | null = null;
        try {
          const textPath = getTextContentPath(pdfId);
          await fs.access(textPath);
          textContent = await fs.readFile(textPath, 'utf-8');
        } catch {
          // Text file doesn't exist, that's ok
        }
        
        // Reconstruct PDF object
        const pdf: PDFFile = {
          ...metadata,
          uploadedAt: new Date(metadata.uploadedAt),
          textContent,
        };
        
        pdfFiles.set(pdfId, pdf);
      } catch (error) {
        console.error(`[PDF Storage] Failed to load PDF ${pdfId}:`, error);
      }
    }
    
    console.log(`[PDF Storage] Loaded ${pdfFiles.size} PDFs from filesystem`);
  } catch (error) {
    console.error('[PDF Storage] Failed to scan filesystem:', error);
  }
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
