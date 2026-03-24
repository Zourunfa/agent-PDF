import { NextRequest, NextResponse } from 'next/server';
import { QuotaService } from '@/services/quota.service';
import { AuthService } from '@/services/auth.service';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse } from '@/lib/utils/response';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { generateFingerprint } from '@/lib/auth/fingerprint';
import {
  getGuestUsage,
  getGuestRemaining,
  canGuestProceed,
  incrementGuestUsage,
  migrateGuestData,
} from '@/lib/storage/guest-storage';

/**
 * 配额控制器
 * 处理配额相关的 HTTP 请求
 */
export class QuotaController {
  private quotaService: QuotaService;
  private authService: AuthService;

  constructor() {
    this.quotaService = new QuotaService();
    this.authService = new AuthService();
  }

  /**
   * 获取当前用户 ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    const user = await this.authService.getCurrentUser();
    return user?.id || null;
  }

  /**
   * GET /api/v1/guest/quota - 获取游客配额信息
   */
  async getGuestQuota(req: NextRequest): Promise<NextResponse> {
    try {
      const fingerprint = await generateFingerprint();

      const usage = await getGuestUsage(fingerprint);
      const remaining = await getGuestRemaining(fingerprint);
      const canProceed = await canGuestProceed(fingerprint);

      return successResponse({
        remaining,
        limit: 3,
        used: usage.count,
        canProceed,
        usage: {
          count: usage.count,
          pdfIds: usage.pdfIds,
          lastUsed: usage.lastUsed,
        },
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/guest/track - 追踪游客使用
   */
  async trackGuestUsage(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { action, pdfId } = body;

      // 验证 action
      if (!action || !['upload', 'chat'].includes(action)) {
        return successResponse(
          {
            error: 'INVALID_ACTION',
            message: 'Action must be "upload" or "chat"',
          },
          400
        );
      }

      const fingerprint = await generateFingerprint();

      // 检查是否可以继续
      const canProceed = await canGuestProceed(fingerprint);

      if (!canProceed) {
        const remaining = await getGuestRemaining(fingerprint);

        return successResponse({
          allowed: false,
          error: 'QUOTA_EXCEEDED',
          message: '您已达到免费试用上限（3次），请注册账户继续使用',
          remaining: 0,
          limit: 3,
          used: 3,
        });
      }

      // 记录使用
      const usage = await incrementGuestUsage(fingerprint, pdfId);
      const remaining = await getGuestRemaining(fingerprint);

      return successResponse({
        allowed: remaining > 0,
        usage: {
          count: usage.count,
          remaining,
          limit: 3,
          pdfIds: usage.pdfIds,
        },
        message: remaining > 0 ? `还可以使用 ${remaining} 次` : '已达到免费试用上限',
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/guest/migrate - 迁移游客数据到用户账户
   */
  async migrateGuestData(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new UnauthorizedError('您需要先登录');
      }

      const body = await req.json();
      const { guestFingerprint } = body;

      if (!guestFingerprint) {
        throw new ValidationError('缺少游客指纹');
      }

      const result = await migrateGuestData(guestFingerprint, userId);

      return successResponse({
        message: '数据迁移成功',
        migratedPdfs: result.migratedPdfs,
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/quota/stats - 获取用户配额统计
   */
  async getUserQuotaStats(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new UnauthorizedError('请先登录');
      }

      const stats = await this.quotaService.getQuotaStatus(userId);

      return successResponse(stats);
    } catch (error) {
      return handleError(error);
    }
  }
}
