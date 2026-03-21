/**
 * Validation utilities
 */

import { ParseStatus, UploadStatus } from '@/types/pdf';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_MIME_TYPE = 'application/pdf';

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `文件大小不能超过 1MB（当前: ${(file.size / 1024 / 1024).toFixed(2)}MB）`,
    };
  }

  // Check MIME type
  if (file.type !== ALLOWED_MIME_TYPE) {
    return {
      valid: false,
      error: `仅支持 PDF 格式的文件（当前: ${file.type || '未知格式'}）`,
    };
  }

  // Sanitize filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  return {
    valid: true,
    sanitizedName,
  };
}

/**
 * 验证 PDF 文件头（Buffer 版本）
 * 检查文件是否以 %PDF- 开头，以及是否以 %%EOF 结尾
 */
export function validatePDFBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  // 检查最小文件大小（一个有效 PDF 至少需要几十字节）
  if (buffer.length < 100) {
    return { valid: false, error: 'PDF 文件太小，可能已损坏' };
  }

  // 检查 PDF 文件头
  const header = buffer.slice(0, 5).toString('utf-8');
  if (!header.startsWith('%PDF-')) {
    return { valid: false, error: '文件不是有效的 PDF 格式（文件头错误）' };
  }

  // 检查 PDF 文件尾
  const tail = buffer.slice(-6).toString('utf-8').trim();
  if (!tail.endsWith('%%EOF')) {
    return { valid: false, error: 'PDF 文件不完整（缺少结束标记）' };
  }

  return { valid: true };
}

/**
 * Validate chat input
 */
export function validateChatInput(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: '请输入有效问题' };
  }

  if (input.length > 10000) {
    return { valid: false, error: '问题长度不能超过 10000 字符' };
  }

  return { valid: true };
}

/**
 * Validate PDF ID
 */
export function validatePdfId(pdfId: string): { valid: boolean; error?: string } {
  if (!pdfId || pdfId.trim().length === 0) {
    return { valid: false, error: 'PDF ID 不能为空' };
  }

  return { valid: true };
}
