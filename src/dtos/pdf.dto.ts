import { z } from 'zod';

/**
 * PDF 上传响应
 */
export interface UploadPDFResult {
  pdfId: string;
  filename: string;
  fileSize: number;
  uploadedAt: Date;
}

/**
 * PDF 列表查询 Schema
 */
export const GetPDFListSchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'pageCount', 'filename'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetPDFListDTO = z.infer<typeof GetPDFListSchema>;

/**
 * PDF 列表项
 */
export interface PDFListItem {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  parseStatus: string;
  createdAt: Date;
  conversationCount: number;
  lastConversationAt: Date | null;
}

/**
 * PDF 详情
 */
export interface PDFDetail {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  parseStatus: string;
  textContent: string | null;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
  parsedAt: Date | null;
}

/**
 * 删除 PDF 响应
 */
export interface DeletePDFResult {
  pdfId: string;
  deleted: boolean;
  message: string;
}

/**
 * 手动文本输入 Schema
 */
export const ManualTextInputSchema = z.object({
  text: z
    .string()
    .min(100, 'Text must be at least 100 characters')
    .max(100000, 'Text cannot exceed 100,000 characters'),
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename cannot exceed 255 characters')
    .optional(),
});

export type ManualTextInputDTO = z.infer<typeof ManualTextInputSchema>;

/**
 * 解析状态更新响应
 */
export interface ParseStatusResult {
  pdfId: string;
  parseStatus: string;
  pageCount: number | null;
  message: string;
}
