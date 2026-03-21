/**
 * PDF List Retrieval Utilities
 * Handles fetching user's PDFs with conversation statistics
 */

import { createClient } from '@/lib/supabase/server';

export interface PDFListItem {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  parseStatus: 'pending' | 'parsing' | 'completed' | 'failed';
  uploadedAt: string;
  conversationCount: number;
  lastConversationAt: string | null;
}

export interface GetPDFListParams {
  userId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'uploadedAt' | 'conversationCount' | 'lastConversationAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetPDFListResult {
  total: number;
  pdfs: PDFListItem[];
}

/**
 * Get user's PDF list with conversation statistics
 */
export async function getPDFList(params: GetPDFListParams): Promise<GetPDFListResult> {
  const supabase = createClient();
  const { userId, limit = 50, offset = 0, sortBy = 'uploadedAt', sortOrder = 'desc' } = params;

  console.log('[getPDFList] Fetching PDF list:', {
    userId,
    limit,
    offset,
    sortBy,
    sortOrder,
  });

  try {
    // Validate parameters
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    // 分两步查询：先获取 PDF 列表，再获取对话统计
    // 1. 获取 PDF 列表
    let query = supabase
      .from('user_pdfs')
      .select('id, filename, file_size, page_count, parse_status, created_at', { count: 'exact' })
      .eq('user_id', userId);

    // Apply sorting
    const sortColumn = sortBy === 'uploadedAt' ? 'created_at' : 'created_at';
    const isDescending = sortOrder === 'desc';
    query = query.order(sortColumn, { ascending: !isDescending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: pdfsData, error: pdfsError, count } = await query;

    if (pdfsError) throw pdfsError;

    console.log('[getPDFList] Query successful, found', count, 'total PDFs');

    if (!pdfsData || pdfsData.length === 0) {
      return {
        total: count || 0,
        pdfs: [],
      };
    }

    // 2. 批量获取对话统计（通过 pdf_id 关联）
    const pdfIds = pdfsData.map((pdf: any) => pdf.id);

    const { data: conversationsData, error: convError } = await supabase
      .from('pdf_conversations')
      .select('pdf_id, message_count, last_message_at')
      .in('pdf_id', pdfIds);

    if (convError) {
      console.error('[getPDFList] Warning: Failed to fetch conversations:', convError);
      // 继续执行，只是对话统计为空
    }

    // 3. 构建 PDF ID -> 对话统计的映射
    const convMap = new Map<string, { message_count: number; last_message_at: string | null }>();
    if (conversationsData) {
      for (const conv of conversationsData) {
        convMap.set((conv as any).pdf_id, {
          message_count: (conv as any).message_count || 0,
          last_message_at: (conv as any).last_message_at,
        });
      }
    }

    // 4. 组装数据
    const pdfs: PDFListItem[] = pdfsData.map((pdf: any) => {
      const convStats = convMap.get(pdf.id);

      return {
        id: pdf.id,
        filename: pdf.filename,
        fileSize: pdf.file_size,
        pageCount: pdf.page_count,
        parseStatus: pdf.parse_status,
        uploadedAt: pdf.created_at,
        conversationCount: convStats?.message_count || 0,
        lastConversationAt: convStats?.last_message_at || null,
      };
    });

    console.log('[getPDFList] Transformed', pdfs.length, 'PDFs');

    // 如果需要按对话数排序，在内存中排序
    if (sortBy === 'conversationCount' || sortBy === 'lastConversationAt') {
      pdfs.sort((a, b) => {
        const aVal =
          sortBy === 'conversationCount'
            ? a.conversationCount
            : a.lastConversationAt
              ? new Date(a.lastConversationAt).getTime()
              : 0;
        const bVal =
          sortBy === 'conversationCount'
            ? b.conversationCount
            : b.lastConversationAt
              ? new Date(b.lastConversationAt).getTime()
              : 0;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    return {
      total: count || 0,
      pdfs,
    };
  } catch (error) {
    console.error('[getPDFList] Error fetching PDF list:', error);
    throw error;
  }
}

/**
 * Get a single PDF with its conversation stats
 */
/**
 * Get a single PDF with its conversation stats
 */
export async function getPDFWithStats(pdfId: string, userId: string): Promise<PDFListItem | null> {
  const supabase = createClient();

  console.log('[getPDFWithStats] Fetching PDF:', { pdfId, userId });

  try {
    // 1. 获取 PDF 信息
    const { data: pdfData, error: pdfError } = await supabase
      .from('user_pdfs')
      .select('id, filename, file_size, page_count, parse_status, created_at')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (pdfError) {
      if (pdfError.code === 'PGRST116') {
        // No rows found
        console.log('[getPDFWithStats] PDF not found');
        return null;
      }
      throw pdfError;
    }

    // 2. 获取对话统计
    let conversationCount = 0;
    let lastConversationAt: string | null = null;

    const { data: convData, error: convError } = await supabase
      .from('pdf_conversations')
      .select('message_count, last_message_at')
      .eq('pdf_id', pdfId)
      .maybeSingle();

    if (convData && !convError) {
      conversationCount = convData.message_count || 0;
      lastConversationAt = convData.last_message_at;
    }

    const pdf: PDFListItem = {
      id: pdfData.id,
      filename: pdfData.filename,
      fileSize: pdfData.file_size,
      pageCount: pdfData.page_count,
      parseStatus: pdfData.parse_status,
      uploadedAt: pdfData.created_at,
      conversationCount,
      lastConversationAt,
    };

    console.log('[getPDFWithStats] PDF found:', pdf);

    return pdf;
  } catch (error) {
    console.error('[getPDFWithStats] Error fetching PDF:', error);
    throw error;
  }
}

/**
 * Check if user owns a PDF
 */
export async function userOwnsPDF(pdfId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  console.log('[userOwnsPDF] Checking ownership:', { pdfId, userId });

  try {
    const { data, error } = await supabase
      .from('user_pdfs')
      .select('id')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('[userOwnsPDF] User does not own PDF');
        return false;
      }
      throw error;
    }

    console.log('[userOwnsPDF] User owns PDF');
    return true;
  } catch (error) {
    console.error('[userOwnsPDF] Error checking ownership:', error);
    throw error;
  }
}

/**
 * Get PDF count for user
 */
export async function getUserPDFCount(userId: string): Promise<number> {
  const supabase = createClient();

  console.log('[getUserPDFCount] Getting PDF count for user:', userId);

  try {
    const { count, error } = await supabase
      .from('user_pdfs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;

    console.log('[getUserPDFCount] PDF count:', count);

    return count || 0;
  } catch (error) {
    console.error('[getUserPDFCount] Error getting PDF count:', error);
    throw error;
  }
}
