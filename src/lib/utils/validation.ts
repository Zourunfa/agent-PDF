/**
 * Validation utilities
 */

import { ParseStatus, UploadStatus } from "@/types/pdf";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPE = "application/pdf";

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `文件大小不能超过 10MB（当前: ${(file.size / 1024 / 1024).toFixed(2)}MB）`,
    };
  }

  // Check MIME type
  if (file.type !== ALLOWED_MIME_TYPE) {
    return {
      valid: false,
      error: `仅支持 PDF 格式的文件（当前: ${file.type || "未知格式"}）`,
    };
  }

  // Sanitize filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  return {
    valid: true,
    sanitizedName,
  };
}

/**
 * Validate chat input
 */
export function validateChatInput(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: "请输入有效问题" };
  }

  if (input.length > 10000) {
    return { valid: false, error: "问题长度不能超过 10000 字符" };
  }

  return { valid: true };
}

/**
 * Validate PDF ID
 */
export function validatePdfId(pdfId: string): { valid: boolean; error?: string } {
  if (!pdfId || pdfId.trim().length === 0) {
    return { valid: false, error: "PDF ID 不能为空" };
  }

  return { valid: true };
}
