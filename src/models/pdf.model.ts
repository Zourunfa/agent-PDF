/**
 * PDF 解析状态枚举
 */
export type ParseStatus = 'pending' | 'parsing' | 'completed' | 'failed';

/**
 * PDF 基础模型
 */
export interface PDF {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  storagePath: string;
  parseStatus: ParseStatus;
  textContent: string | null;
  pineconeNamespace: string | null;
  createdAt: Date;
  updatedAt: Date;
  parsedAt: Date | null;
}

/**
 * PDF 带统计信息的扩展模型
 */
export interface PDFWithStats extends PDF {
  conversationCount: number;
  messageCount: number;
  lastConversationAt: Date | null;
}

/**
 * 创建 PDF 的数据
 */
export interface CreatePDFData {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  storagePath: string;
  pageCount?: number;
  pineconeNamespace?: string;
}

/**
 * 更新 PDF 解析状态的数据
 */
export interface UpdateParseStatusData {
  status: ParseStatus;
  pageCount?: number;
  textContent?: string;
}

/**
 * PDF 列表查询选项
 */
export interface PDFListOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'pageCount' | 'conversationCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 数据库记录到 PDF 模型的映射
 */
export function mapDbToPDF(data: Record<string, unknown>): PDF {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    filename: data.filename as string,
    fileSize: data.file_size as number,
    pageCount: data.page_count as number | null,
    storagePath: data.storage_path as string,
    parseStatus: (data.parse_status as ParseStatus) || 'pending',
    textContent: data.text_content as string | null,
    pineconeNamespace: data.pinecone_namespace as string | null,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
    parsedAt: data.parsed_at ? new Date(data.parsed_at as string) : null,
  };
}

/**
 * PDF 模型到数据库记录的映射
 */
export function mapPDFToDb(pdf: Partial<PDF>): Record<string, unknown> {
  return {
    id: pdf.id,
    user_id: pdf.userId,
    filename: pdf.filename,
    file_size: pdf.fileSize,
    page_count: pdf.pageCount,
    storage_path: pdf.storagePath,
    parse_status: pdf.parseStatus,
    text_content: pdf.textContent,
    pinecone_namespace: pdf.pineconeNamespace,
    parsed_at: pdf.parsedAt?.toISOString(),
    updated_at: new Date().toISOString(),
  };
}
