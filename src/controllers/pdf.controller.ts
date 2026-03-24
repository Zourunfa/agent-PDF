import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/services/pdf.service';
import { StorageService } from '@/services/storage.service';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse, paginatedResponse } from '@/lib/utils/response';
import { GetPDFListSchema } from '@/dtos/pdf.dto';
import { parsePaginationWithSortFromSearchParams } from '@/dtos/common.dto';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/utils/errors';
import { AuthService } from '@/services/auth.service';
import { getAllPDFFiles } from '@/lib/storage/pdf-files';
import { parsePDF, isValidPDFText } from '@/lib/pdf/parser';
import { splitTextWithMetadata } from '@/lib/pdf/text-splitter';
import { ParseStatus } from '@/types/pdf';

/**
 * PDF 控制器
 * 处理 PDF 相关的 HTTP 请求
 */
export class PDFController {
  private pdfService: PDFService;
  private storageService: StorageService;
  private authService: AuthService;

  constructor() {
    this.pdfService = new PDFService();
    this.storageService = new StorageService();
    this.authService = new AuthService();
  }

  /**
   * 获取当前用户 ID
   */
  private async getCurrentUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('请先登录');
    }
    return user.id;
  }

  /**
   * POST /api/v1/pdfs - 上传 PDF
   */
  async upload(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return successResponse({ error: '请选择要上传的文件' }, 400);
      }

      // 上传到存储
      const storageResult = await this.storageService.uploadPDF(userId, file);

      // 创建数据库记录
      const result = await this.pdfService.uploadPDF(userId, file, storageResult.storagePath);

      return successResponse(result, 201);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/pdfs - 获取 PDF 列表
   */
  async getList(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const searchParams = req.nextUrl.searchParams;
      const options = parsePaginationWithSortFromSearchParams(searchParams, [
        'createdAt',
        'updatedAt',
        'pageCount',
        'filename',
      ]);

      const result = await this.pdfService.getPDFList(userId, options);

      return paginatedResponse(result.pdfs, result.total, options.limit, options.offset);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/pdfs/[id] - 获取 PDF 详情
   */
  async getById(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      const { id } = await params;

      const result = await this.pdfService.getPDFById(id, userId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * DELETE /api/v1/pdfs/[id] - 删除 PDF
   */
  async delete(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      const { id } = await params;

      const result = await this.pdfService.deletePDF(id, userId, async (path) => {
        await this.storageService.deleteFile(userId, path);
      });

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * PATCH /api/v1/pdfs/[id]/parse-status - 更新解析状态
   */
  async updateParseStatus(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      const { id } = await params;

      const body = await req.json();
      const { status, pageCount, textContent } = body;

      const result = await this.pdfService.updateParseStatus(id, userId, status, {
        pageCount,
        textContent,
      });

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/storage/usage - 获取存储使用情况
   */
  async getStorageUsage(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const result = await this.pdfService.getStorageUsage(userId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/files - 获取所有 PDF 文件
   */
  async getAllFiles(req: NextRequest): Promise<NextResponse> {
    try {
      const pdfs = await getAllPDFFiles();

      return successResponse({
        pdfs,
        count: pdfs.length,
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/parse - 解析 PDF
   */
  async parse(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { pdfId } = body;

      if (!pdfId) {
        return successResponse(
          {
            error: 'INVALID_REQUEST',
            message: '缺少 PDF ID',
          },
          400
        );
      }

      // 调用原有的解析逻辑
      const result = await this.parsePDFInternal(pdfId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/parse - 获取解析状态
   */
  async getParseStatus(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const pdfId = searchParams.get('pdfId');

      if (!pdfId) {
        return successResponse(
          {
            error: 'INVALID_REQUEST',
            message: '缺少 PDF ID',
          },
          400
        );
      }

      // 从存储获取解析状态
      const { getPDFFile } = await import('@/lib/storage/pdf-files');
      const pdfFile = await getPDFFile(pdfId);

      if (!pdfFile) {
        return successResponse(
          {
            error: 'NOT_FOUND',
            message: '找不到 PDF 解析记录',
          },
          404
        );
      }

      return successResponse({
        pdfId,
        parseStatus: pdfFile.parseStatus,
        progress: pdfFile.parseStatus === ParseStatus.COMPLETED ? 100 : 0,
        textContent: pdfFile.textContent || undefined,
        pageCount: pdfFile.pageCount || undefined,
        completedAt:
          pdfFile.parseStatus === ParseStatus.COMPLETED ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * 内部 PDF 解析方法
   */
  private async parsePDFInternal(pdfId: string): Promise<any> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');

    // 获取临时文件路径
    const tempDir = process.env.VERCEL
      ? path.join('/tmp', 'pdf-chat')
      : path.join(os.tmpdir(), 'pdf-chat');
    const filePath = path.join(tempDir, `${pdfId}.pdf`);

    let fileExists = false;
    try {
      await fs.access(filePath);
      fileExists = true;
    } catch {
      // 文件不存在，尝试从数据库获取
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();

      const { data: pdfRecord, error } = await supabase
        .from('user_pdfs')
        .select('storage_path')
        .eq('id', pdfId)
        .single();

      if (error || !pdfRecord) {
        throw new NotFoundError('PDF not found');
      }

      const storagePath = (pdfRecord as any).storage_path;

      if (storagePath && storagePath.startsWith('http')) {
        const { downloadPDFFromBlob } = await import('@/lib/storage/blob-storage');
        const buffer = await downloadPDFFromBlob(storagePath);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(filePath, buffer);
        fileExists = true;
      } else if (storagePath) {
        const buffer = await fs.readFile(storagePath);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(filePath, buffer);
        fileExists = true;
      }
    }

    if (!fileExists) {
      throw new NotFoundError('PDF file not found');
    }

    const buffer = await fs.readFile(filePath);
    const parseResult = await parsePDF(buffer);
    const { text, pages } = parseResult;

    // 更新存储
    const { getPDFFile, addPDFFile } = await import('@/lib/storage/pdf-files');
    const pdfFile = await getPDFFile(pdfId);
    if (pdfFile) {
      pdfFile.textContent = text;
      pdfFile.pageCount = pages;
      pdfFile.parseStatus = ParseStatus.COMPLETED;
      await addPDFFile(pdfFile);
    }

    // 更新数据库
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    await supabase
      .from('user_pdfs')
      .update({
        text_content: text,
        page_count: pages,
        parse_status: ParseStatus.COMPLETED,
        parsed_at: new Date().toISOString(),
      })
      .eq('id', pdfId);

    // 分块并创建向量存储
    const chunks = await splitTextWithMetadata(text, {
      pdfId,
      source: 'pdf',
      pageCount: pages,
    });

    try {
      const { createVectorStoreFromChunks } = await import('@/lib/langchain/vector-store');
      await createVectorStoreFromChunks(pdfId, chunks);
    } catch (vectorError) {
      console.error('Vector store creation failed:', vectorError);
      // 继续执行，文本已解析，只是向量搜索不可用
    }

    return {
      pdfId,
      parseStatus: ParseStatus.COMPLETED,
      textContent: text,
      pageCount: pages,
    };
  }
}
