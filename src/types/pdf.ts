/**
 * PDF entity types
 */

export enum ParseStatus {
  PENDING = "pending",
  PARSING = "parsing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum UploadStatus {
  PENDING = "pending",
  UPLOADING = "uploading",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface PDFFile {
  id: string;
  fileName: string;
  sanitizedName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  parseStatus: ParseStatus;
  textContent: string | null;
  pageCount: number | null;
  tempPath: string | null;
  base64Data?: string; // Base64-encoded PDF data for preview (frontend only)
}

export interface UploadTask {
  taskId: string;
  pdfId: string;
  progress: number;
  status: UploadStatus;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}
