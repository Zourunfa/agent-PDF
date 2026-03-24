import { PDFRepository } from '@/repositories/pdf.repository';
import { ConversationRepository } from '@/repositories/conversation.repository';
import { QuotaRepository } from '@/repositories/quota.repository';
import { QuotaExceededError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import type { PDF, PDFWithStats } from '@/models/pdf.model';
import type { CreatePDFData, PDFListOptions } from '@/models/pdf.model';
import type { UploadPDFResult, PDFListItem, DeletePDFResult } from '@/dtos/pdf.dto';

/**
 * PDF 服务
 * 处理 PDF 相关的业务逻辑
 */
export class PDFService {
  constructor(
    private pdfRepo: PDFRepository = new PDFRepository(),
    private convRepo: ConversationRepository = new ConversationRepository(),
    private quotaRepo: QuotaRepository = new QuotaRepository()
  ) {}

  /**
   * 上传 PDF
   */
  async uploadPDF(
    userId: string,
    file: File,
    storagePath: string,
    options?: { skipQuotaCheck?: boolean }
  ): Promise<UploadPDFResult> {
    // 1. 配额检查
    if (!options?.skipQuotaCheck) {
      const quotaResult = await this.quotaRepo.checkQuota(userId, 'pdf_uploads_daily');
      if (!quotaResult.allowed) {
        throw new QuotaExceededError(
          quotaResult.reason || 'Daily upload limit exceeded',
          {
            quotaType: 'pdf_uploads_daily',
            limit: quotaResult.limit,
            current: quotaResult.current,
          }
        );
      }

      // 检查存储配额
      const storageResult = await this.quotaRepo.checkQuota(userId, 'storage_total');
      if (storageResult.remaining < file.size) {
        throw new QuotaExceededError(
          'Storage limit exceeded. Please delete some files to free up space.',
          {
            quotaType: 'storage_total',
            limit: storageResult.limit,
            current: storageResult.current,
          }
        );
      }
    }

    // 2. 文件验证
    this.validatePDFFile(file);

    // 3. 生成 PDF ID
    const pdfId = crypto.randomUUID();

    // 4. 创建数据库记录
    const createData: CreatePDFData = {
      id: pdfId,
      userId,
      filename: file.name,
      fileSize: file.size,
      storagePath,
      pineconeNamespace: userId,
    };

    const pdf = await this.pdfRepo.create(createData);

    // 5. 消耗配额
    if (!options?.skipQuotaCheck) {
      await this.quotaRepo.consumeQuota(userId, 'pdf_uploads_daily', 1);
      await this.quotaRepo.incrementStorage(userId, file.size);
    }

    // 6. 创建对话记录
    await this.convRepo.createOrGet(pdfId, userId);

    return {
      pdfId: pdf.id,
      filename: pdf.filename,
      fileSize: pdf.fileSize,
      uploadedAt: pdf.createdAt,
    };
  }

  /**
   * 获取 PDF 列表
   */
  async getPDFList(
    userId: string,
    options: PDFListOptions = {}
  ): Promise<{ pdfs: PDFListItem[]; total: number }> {
    const { pdfs, total } = await this.pdfRepo.findByUserIdWithStats(userId, options);

    const pdfListItems: PDFListItem[] = pdfs.map((pdf) => ({
      id: pdf.id,
      filename: pdf.filename,
      fileSize: pdf.fileSize,
      pageCount: pdf.pageCount,
      parseStatus: pdf.parseStatus,
      createdAt: pdf.createdAt,
      conversationCount: pdf.conversationCount,
      lastConversationAt: pdf.lastConversationAt,
    }));

    return { pdfs: pdfListItems, total };
  }

  /**
   * 获取 PDF 详情
   */
  async getPDFById(pdfId: string, userId: string): Promise<PDF> {
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }
    return pdf;
  }

  /**
   * 删除 PDF
   */
  async deletePDF(
    pdfId: string,
    userId: string,
    storageDeleteFn?: (path: string) => Promise<void>
  ): Promise<DeletePDFResult> {
    // 1. 验证所有权并获取 PDF 信息
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }

    // 2. 删除对话记录（包括消息）
    await this.convRepo.deleteByPdf(pdfId, userId);

    // 3. 删除存储文件
    if (storageDeleteFn) {
      try {
        await storageDeleteFn(pdf.storagePath);
      } catch (error) {
        console.error('Failed to delete storage file:', error);
        // 继续删除数据库记录
      }
    }

    // 4. 删除 PDF 记录
    await this.pdfRepo.delete(pdfId, userId);

    // 5. 释放存储配额
    await this.quotaRepo.decrementStorage(userId, pdf.fileSize);

    return {
      pdfId,
      deleted: true,
      message: 'PDF deleted successfully',
    };
  }

  /**
   * 更新解析状态
   */
  async updateParseStatus(
    pdfId: string,
    userId: string,
    status: 'pending' | 'parsing' | 'completed' | 'failed',
    updates?: { pageCount?: number; textContent?: string }
  ): Promise<PDF> {
    // 验证所有权
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }

    return this.pdfRepo.updateParseStatus(pdfId, status, updates);
  }

  /**
   * 验证 PDF 文件
   */
  private validatePDFFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new ValidationError('File must be a PDF');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new ValidationError('File size must be less than 50MB');
    }
    if (file.size === 0) {
      throw new ValidationError('File is empty');
    }
  }

  /**
   * 检查用户是否拥有 PDF
   */
  async belongsToUser(pdfId: string, userId: string): Promise<boolean> {
    return this.pdfRepo.belongsToUser(pdfId, userId);
  }

  /**
   * 获取用户的存储使用情况
   */
  async getStorageUsage(userId: string): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    const quota = await this.quotaRepo.getQuota(userId);
    return {
      used: quota.storageUsed,
      limit: quota.storageLimit,
      percentage: (quota.storageUsed / quota.storageLimit) * 100,
    };
  }
}
