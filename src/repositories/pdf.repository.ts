import { createClient } from '@/lib/supabase/server';
import type { PDF, PDFWithStats } from '@/models/pdf.model';
import type { CreatePDFData, UpdateParseStatusData, PDFListOptions } from '@/models/pdf.model';
import { mapDbToPDF } from '@/models/pdf.model';
import { DatabaseError, NotFoundError } from '@/lib/utils/errors';

/**
 * PDF 数据访问层
 * 封装所有 PDF 相关的数据库操作
 */
export class PDFRepository {
  /**
   * 创建 PDF 记录
   */
  async create(data: CreatePDFData): Promise<PDF> {
    try {
      const supabase = await createClient();

      const { data: pdf, error } = await supabase
        .from('user_pdfs')
        .insert({
          id: data.id,
          user_id: data.userId,
          filename: data.filename,
          file_size: data.fileSize,
          storage_path: data.storagePath,
          page_count: data.pageCount || null,
          pinecone_namespace: data.pineconeNamespace || data.userId,
          parse_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create PDF: ${error.message}`);
      }

      return mapDbToPDF(pdf);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create PDF');
    }
  }

  /**
   * 根据 ID 获取 PDF（验证用户所有权）
   */
  async findById(pdfId: string, userId: string): Promise<PDF | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_pdfs')
        .select('*')
        .eq('id', pdfId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Failed to fetch PDF: ${error.message}`);
      }

      return mapDbToPDF(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch PDF');
    }
  }

  /**
   * 获取用户 PDF 列表
   */
  async findByUserId(
    userId: string,
    options: PDFListOptions = {}
  ): Promise<{ pdfs: PDF[]; total: number }> {
    try {
      const supabase = await createClient();
      const {
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // 映射排序字段到数据库字段
      const sortFieldMap: Record<string, string> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        pageCount: 'page_count',
        filename: 'filename',
      };
      const dbSortField = sortFieldMap[sortBy] || 'created_at';

      let query = supabase
        .from('user_pdfs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order(dbSortField, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to fetch PDF list: ${error.message}`);
      }

      return {
        pdfs: data.map(mapDbToPDF),
        total: count || 0,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch PDF list');
    }
  }

  /**
   * 获取用户 PDF 列表（带统计信息）
   */
  async findByUserIdWithStats(
    userId: string,
    options: PDFListOptions = {}
  ): Promise<{ pdfs: PDFWithStats[]; total: number }> {
    try {
      const supabase = await createClient();
      const { pdfs, total } = await this.findByUserId(userId, options);

      // 获取每个 PDF 的对话统计
      const pdfsWithStats = await Promise.all(
        pdfs.map(async (pdf) => {
          const { data: messages, error } = await supabase
            .from('conversation_messages')
            .select('created_at', { count: 'exact' })
            .eq('pdf_id', pdf.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error(`Failed to fetch stats for PDF ${pdf.id}:`, error);
          }

          return {
            ...pdf,
            conversationCount: 0, // 需要查询 conversations 表
            messageCount: messages?.length || 0,
            lastConversationAt:
              messages && messages.length > 0
                ? new Date(messages[0].created_at)
                : null,
          };
        })
      );

      return { pdfs: pdfsWithStats, total };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch PDF list with stats');
    }
  }

  /**
   * 更新解析状态
   */
  async updateParseStatus(
    pdfId: string,
    status: UpdateParseStatusData['status'],
    updates?: { pageCount?: number; textContent?: string }
  ): Promise<PDF> {
    try {
      const supabase = await createClient();

      const updateData: Record<string, unknown> = {
        parse_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.parsed_at = new Date().toISOString();
        if (updates?.pageCount) updateData.page_count = updates.pageCount;
        if (updates?.textContent) updateData.text_content = updates.textContent;
      }

      if (status === 'failed') {
        // 可以添加错误信息字段
      }

      const { data, error } = await supabase
        .from('user_pdfs')
        .update(updateData)
        .eq('id', pdfId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update parse status: ${error.message}`);
      }

      if (!data) {
        throw new NotFoundError('PDF not found');
      }

      return mapDbToPDF(data);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update parse status');
    }
  }

  /**
   * 删除 PDF
   */
  async delete(pdfId: string, userId: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('user_pdfs')
        .delete()
        .eq('id', pdfId)
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(`Failed to delete PDF: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete PDF');
    }
  }

  /**
   * 检查 PDF 是否属于用户
   */
  async belongsToUser(pdfId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_pdfs')
        .select('id')
        .eq('id', pdfId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw new DatabaseError(`Failed to check PDF ownership: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to check PDF ownership');
    }
  }

  /**
   * 获取用户的总存储使用量
   */
  async getTotalStorageUsed(userId: string): Promise<number> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_pdfs')
        .select('file_size')
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(`Failed to get storage used: ${error.message}`);
      }

      return data.reduce((sum, pdf) => sum + (pdf.file_size || 0), 0);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get storage used');
    }
  }
}
