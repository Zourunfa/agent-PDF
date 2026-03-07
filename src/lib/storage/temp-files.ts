/**
 * Temporary file storage utilities
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import os from "os";

// Use /tmp for serverless environments (Vercel, AWS Lambda)
// Falls back to OS temp directory if /tmp doesn't exist
const TEMP_DIR = process.env.VERCEL 
  ? path.join('/tmp', 'pdf-chat')
  : path.join(os.tmpdir(), 'pdf-chat');

/**
 * Ensure temp directory exists
 */
export async function ensureTempDir(): Promise<void> {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create temp directory:", error);
  }
}

/**
 * Generate unique file path using pdfId
 */
export function generateTempFileName(pdfId: string): string {
  return `${pdfId}.pdf`;
}

/**
 * Get full temp file path
 */
export function getTempFilePath(fileName: string): string {
  return path.join(TEMP_DIR, fileName);
}

/**
 * Save file to temp directory
 */
export async function saveTempFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  await ensureTempDir();
  const filePath = getTempFilePath(fileName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Delete temp file
 */
export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete temp file ${filePath}:`, error);
  }
}

/**
 * Clean up old temp files (older than 1 hour)
 */
export async function cleanupOldTempFiles(): Promise<void> {
  try {
    await ensureTempDir();
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > maxAge) {
          await deleteTempFile(filePath);
        }
      } catch (error) {
        // File might not exist, continue
      }
    }
  } catch (error) {
    console.error("Failed to cleanup temp files:", error);
  }
}
