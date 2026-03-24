import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/user.repository';
import { QuotaRepository } from '@/repositories/quota.repository';
import { PDFRepository } from '@/repositories/pdf.repository';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse, paginatedResponse } from '@/lib/utils/response';
import { ForbiddenError, UnauthorizedError } from '@/lib/utils/errors';
import { parsePaginationWithSortFromSearchParams } from '@/dtos/common.dto';

/**
 * 管理员控制器
 * 处理管理员相关的 HTTP 请求
 */
export class AdminController {
  private userRepo: UserRepository;
  private quotaRepo: QuotaRepository;
  private pdfRepo: PDFRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.quotaRepo = new QuotaRepository();
    this.pdfRepo = new PDFRepository();
  }

  /**
   * 检查管理员权限
   */
  private async checkAdminAccess(): Promise<string> {
    // 这里需要实现管理员验证逻辑
    // 临时返回一个占位符
    const adminId = process.env.ADMIN_USER_ID;

    if (!adminId) {
      throw new UnauthorizedError('管理员未配置');
    }

    return adminId;
  }

  /**
   * POST /api/v1/admin/login - 管理员登录
   */
  async login(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { username, password } = body;

      // 验证管理员凭证
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (username !== adminUsername || password !== adminPassword) {
        throw new UnauthorizedError('管理员凭证无效');
      }

      // 生成管理员令牌
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      return successResponse({
        token,
        message: '登录成功',
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/admin/users - 获取用户列表
   */
  async getUserList(req: NextRequest): Promise<NextResponse> {
    try {
      await this.checkAdminAccess();

      const searchParams = req.nextUrl.searchParams;
      const options = parsePaginationWithSortFromSearchParams(searchParams, [
        'createdAt',
        'updatedAt',
        'email',
        'role',
      ]);

      // 获取用户列表
      const { limit, offset } = options;

      // 这里需要实现用户列表查询
      const users: unknown[] = [];
      const total = 0;

      return paginatedResponse(users, total, limit, offset);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/admin/users/[id] - 获取用户详情
   */
  async getUserById(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      await this.checkAdminAccess();

      const { id } = await params;

      const user = await this.userRepo.getFullProfile(id);

      if (!user) {
        return successResponse({ error: '用户不存在' }, 404);
      }

      return successResponse(user);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * DELETE /api/v1/admin/users/[id] - 删除用户
   */
  async deleteUser(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      await this.checkAdminAccess();

      const { id } = await params;

      // 软删除用户
      await this.userRepo.softDelete(id);

      return successResponse({
        userId: id,
        deleted: true,
        message: '用户已删除',
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * PATCH /api/v1/admin/users/[id]/quota - 更新用户配额
   */
  async updateUserQuota(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      await this.checkAdminAccess();

      const { id } = await params;
      const body = await req.json();

      const result = await this.quotaRepo.updateLimits(id, {
        pdfUploadsDailyLimit: body.pdfUploadsDailyLimit,
        aiCallsDailyLimit: body.aiCallsDailyLimit,
        storageLimit: body.storageLimit,
      });

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/admin/stats - 获取系统统计
   */
  async getStats(req: NextRequest): Promise<NextResponse> {
    try {
      await this.checkAdminAccess();

      // 获取系统统计数据
      const stats = {
        users: {
          total: 0,
          active: 0,
          premium: 0,
        },
        pdfs: {
          total: 0,
          totalSize: 0,
        },
        conversations: {
          total: 0,
          messages: 0,
        },
      };

      return successResponse(stats);
    } catch (error) {
      return handleError(error);
    }
  }
}
