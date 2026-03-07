/**
 * API contract types
 */

import { PDFFile, UploadTask } from "./pdf";
import { ChatMessage, Conversation } from "./chat";

// Upload API
export interface UploadRequest {
  file: File;
}

export interface UploadResponse {
  success: true;
  data: {
    pdfId: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    parseStatus: string;
    uploadTaskId: string;
  };
}

export interface UploadErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      maxSize?: number;
      actualSize?: number;
      providedType?: string;
      expectedType?: string;
    };
  };
  timestamp: string;
}

// Parse API
export interface ParseRequest {
  pdfId: string;
}

export interface ParseResponse {
  success: true;
  data: {
    pdfId: string;
    parseStatus: string;
    estimatedTime?: number;
    progress?: number;
    textContent?: string;
    pageCount?: number;
    chunkCount?: number;
    completedAt?: string;
  };
}

// Chat API
export interface ChatRequest {
  pdfId: string;
  question: string;
  conversationId: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  type: "start" | "token" | "end" | "error";
  messageId?: string;
  content?: string;
  metadata?: {
    tokenCount: number;
    processingTime: number;
    modelUsed: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Files API
export interface FilesListResponse {
  success: true;
  data: {
    pdfs: PDFFile[];
    count: number;
  };
}

export interface FileDetailsResponse {
  success: true;
  data: PDFFile & {
    hasConversation: boolean;
    conversationId: string | null;
  };
}

// Common
export interface ValidationError {
  field: string;
  message: string;
}
