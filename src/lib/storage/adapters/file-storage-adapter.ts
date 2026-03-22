/**
 * Local File Storage Adapter
 * Provides filesystem-based storage as an alternative to Vercel Blob Storage
 * Designed for Docker/self-hosted deployments
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface FileStorageAdapter {
  upload(id: string, buffer: Buffer, filename: string): Promise<string>;
  download(id: string): Promise<Buffer>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  getUrl(id: string): Promise<string>;
}

export class LocalFileStorage implements FileStorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath: string, baseUrl: string = '/uploads') {
    this.basePath = path.resolve(basePath);
    this.baseUrl = baseUrl;
  }

  private getFilePath(id: string): string {
    return path.join(this.basePath, `${id}.pdf`);
  }

  private getUrlPath(id: string): string {
    return `${this.baseUrl}/${id}.pdf`;
  }

  async upload(id: string, buffer: Buffer, filename: string): Promise<string> {
    const filePath = this.getFilePath(id);

    console.log(`[LocalFileStorage] Uploading PDF ${id} to ${filePath}`);
    console.log(`[LocalFileStorage] File size: ${buffer.length} bytes`);

    try {
      // Ensure directory exists
      await fs.mkdir(this.basePath, { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      const url = this.getUrlPath(id);
      console.log(`[LocalFileStorage] ✓ Uploaded successfully: ${url}`);

      return url;
    } catch (error) {
      console.error(`[LocalFileStorage] ✗ Upload failed:`, error);
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  async download(id: string): Promise<Buffer> {
    const filePath = this.getFilePath(id);

    console.log(`[LocalFileStorage] Downloading PDF ${id} from ${filePath}`);

    try {
      // Check if file exists
      const exists = await this.exists(id);
      if (!exists) {
        throw new Error(`File not found: ${id}`);
      }

      // Read file
      const buffer = await fs.readFile(filePath);
      console.log(`[LocalFileStorage] ✓ Downloaded ${buffer.length} bytes`);

      return buffer;
    } catch (error) {
      console.error(`[LocalFileStorage] ✗ Download failed:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);

    console.log(`[LocalFileStorage] Deleting PDF ${id}`);

    try {
      // Check if file exists before deleting
      const exists = await this.exists(id);
      if (!exists) {
        console.log(`[LocalFileStorage] File ${id} does not exist, skipping delete`);
        return;
      }

      await fs.unlink(filePath);
      console.log(`[LocalFileStorage] ✓ Deleted successfully`);
    } catch (error) {
      console.error(`[LocalFileStorage] ✗ Delete failed:`, error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(id: string): Promise<string> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new Error(`File not found: ${id}`);
    }
    return this.getUrlPath(id);
  }

  /**
   * Get file stats (size, creation time, etc.)
   */
  async getStats(id: string): Promise<{ size: number; created: Date } | null> {
    const filePath = this.getFilePath(id);

    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * List all stored files
   */
  async listFiles(): Promise<Array<{ id: string; size: number; created: Date }>> {
    try {
      const files = await fs.readdir(this.basePath);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));

      const result = [];
      for (const file of pdfFiles) {
        const id = file.replace('.pdf', '');
        const stats = await this.getStats(id);
        if (stats) {
          result.push({ id, ...stats });
        }
      }

      return result;
    } catch (error) {
      console.error(`[LocalFileStorage] Failed to list files:`, error);
      return [];
    }
  }
}

/**
 * Factory function to create storage adapter based on environment
 */
export function createFileStorage(): FileStorageAdapter {
  // Use local filesystem storage for Docker/self-hosted deployments
  const storagePath = process.env.STORAGE_PATH || './data/uploads';
  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_URL || '/uploads';

  console.log(`[FileStorage] Creating local file storage`);
  console.log(`[FileStorage] Storage path: ${storagePath}`);
  console.log(`[FileStorage] Base URL: ${baseUrl}`);

  return new LocalFileStorage(storagePath, baseUrl);
}

/**
 * Singleton instance
 */
let storageInstance: FileStorageAdapter | null = null;

export function getFileStorage(): FileStorageAdapter {
  if (!storageInstance) {
    storageInstance = createFileStorage();
  }
  return storageInstance;
}
