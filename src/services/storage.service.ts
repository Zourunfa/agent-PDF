import { v4 as uuidv4 } from 'uuid';
import {
  uploadPDFToBlob,
  deletePDFFromBlob,
  downloadPDFFromBlob,
} from '@/lib/storage/blob-storage';
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/utils/errors';
import { QuotaRepository } from '@/repositories/quota.repository';
import { PDFRepository } from '@/repositories/pdf.repository';
import type { PDF } from '@/models/pdf.model';

/**
 * 存储服务
 * 处理文件上传、存储、删除等操作
 */
export class StorageService {
  constructor(
    private quotaRepo: QuotaRepository = new QuotaRepository(),
    private pdfRepo: PDFRepository = new PDFRepository()
  ) {}

  /**
   * 上传 PDF 文件到存储
   */
  async uploadPDF(
    userId: string,
    file: File
  ): Promise<{
    storagePath: string;
    fileName: string;
    fileSize: number;
  }> {
    // 1. 验证文件
    this.validatePDFFile(file);

    // 2. 检查存储配额
    const storageQuota = await this.quotaRepo.checkQuota(userId, 'storage_total');
    if (!storageQuota.allowed) {
      throw new ValidationError(
        storageQuota.reason || 'Storage quota exceeded',
        {
          quotaType: 'storage_total',
          limit: storageQuota.limit,
          current: storageQuota.current,
        }
      );
    }

    // 3. 生成文件名和存储路径
    const fileId = uuidv4();
    const timestamp = new Date().toISOString();
    const sanitizedName = this.sanitizeFileName(file.name);
    const fileName = `${fileId}-${timestamp}-${sanitizedName}`;

    // 4. 上传到 Blob Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storagePath = await uploadPDFToBlob(fileId, buffer, file.name);

    // 5. 更新存储使用量
    await this.quotaRepo.incrementStorage(userId, file.size);

    return {
      storagePath,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  /**
   * 上传头像
   */
  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{
    avatarUrl: string;
  }> {
    // 1. 验证文件
    this.validateAvatarFile(file);

    // 2. 生成文件名
    const fileId = uuidv4();
    const timestamp = new Date().toISOString();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}/${fileId}-${timestamp}.${extension}`;

    // 3. TODO: 实现头像上传逻辑
    // 这里需要根据实际的头像存储方式来实现

    return {
      avatarUrl: fileName,
    };
  }

  /**
   * 删除文件
   */
  async deleteFile(userId: string, storagePath: string): Promise<void> {
    try {
      // 如果是 Blob URL，从 Blob Storage 删除
      if (storagePath.startsWith('http')) {
        // 从 URL 提取 pdfId
        const matches = storagePath.match(/\/([^\/]+)\.pdf$/);
        if (matches) {
          const pdfId = matches[1];
          await deletePDFFromBlob(pdfId);
        }
      }
      // 否则从本地存储删除（如果有）
    } catch (error) {
      console.error('Error deleting file:', error);
      // 不抛出错误，允许继续执行
    }
  }

  /**
   * 获取文件
   */
  async getFile(storagePath: string): Promise<Buffer> {
    if (storagePath.startsWith('http')) {
      return downloadPDFFromBlob(storagePath);
    }

    // 本地文件
    const fs = await import('fs/promises');
    return fs.readFile(storagePath);
  }

  /**
   * 验证 PDF 文件
   */
  private validatePDFFile(file: File): void {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new ValidationError('File must be a PDF');
    }

    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('File size exceeds 10MB limit');
    }
  }

  /**
   * 验证头像文件
   */
  private validateAvatarFile(file: File): void {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('File must be an image (JPEG, PNG, GIF, WebP)');
    }

    // 2MB limit
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('File size exceeds 2MB limit');
    }
  }

  /**
   * 清理文件名
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase()
      .substring(0, 100);
  }
}
