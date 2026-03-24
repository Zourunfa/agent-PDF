import { QuotaRepository } from '@/repositories/quota.repository';
import { QuotaExceededError } from '@/lib/utils/errors';
import type { QuotaType } from '@/models/quota.model';

/**
 * 配额服务
 * 处理配额检查、消耗等业务逻辑
 */
export class QuotaService {
  constructor(private quotaRepo: QuotaRepository = new QuotaRepository()) {}

  /**
   * 检查配额
   */
  async checkQuota(
    userId: string,
    quotaType: QuotaType
  ): Promise<{
    allowed: boolean;
    current: number;
    remaining: number;
    limit: number;
    resetAt: Date | null;
    reason?: string;
  }> {
    const result = await this.quotaRepo.checkQuota(userId, quotaType);

    return {
      allowed: result.allowed,
      current: result.current,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.resetAt,
      reason: result.reason,
    };
  }

  /**
   * 消耗配额
   */
  async consumeQuota(
    userId: string,
    quotaType: QuotaType,
    amount: number = 1
  ): Promise<{
    consumed: boolean;
    newAmount: number;
    remaining: number;
  }> {
    const checkResult = await this.checkQuota(userId, quotaType);
    if (!checkResult.allowed) {
      throw new QuotaExceededError(checkResult.reason || 'Quota exceeded', {
        quotaType,
        limit: checkResult.limit,
        current: checkResult.current,
      });
    }

    const result = await this.quotaRepo.consumeQuota(userId, quotaType, amount);

    return {
      consumed: result.consumed,
      newAmount: result.newAmount,
      remaining: result.remaining,
    };
  }

  /**
   * 检查并消耗配额（原子操作)
   */
  async checkAndConsume(
    userId: string,
    quotaType: QuotaType,
    amount: number = 1
  ): Promise<{
    allowed: boolean;
    consumed: boolean;
    remaining: number;
    newAmount: number;
  }> {
    const checkResult = await this.checkQuota(userId, quotaType);
    if (!checkResult.allowed) {
      return {
        allowed: false,
        consumed: false,
        remaining: checkResult.remaining,
        newAmount: checkResult.current,
      };
    }

    const consumeResult = await this.consumeQuota(userId, quotaType, amount);

    return {
      allowed: true,
      consumed: consumeResult.consumed,
      remaining: consumeResult.remaining,
      newAmount: consumeResult.newAmount,
    };
  }

  /**
   * 获取用户配额状态
   */
  async getQuotaStatus(userId: string): Promise<{
    pdfUploads: {
      used: number;
      limit: number;
      remaining: number;
    };
    aiCalls: {
      used: number;
      limit: number;
      remaining: number;
    };
    storage: {
      used: number;
      limit: number;
      remaining: number;
    };
    resetAt: Date | null;
  }> {
    const quota = await this.quotaRepo.getQuota(userId);

    return {
      pdfUploads: {
        used: quota.pdfUploadsDaily,
        limit: quota.pdfUploadsDailyLimit,
        remaining: quota.pdfUploadsDailyLimit - quota.pdfUploadsDaily,
      },
      aiCalls: {
        used: quota.aiCallsDaily,
        limit: quota.aiCallsDailyLimit,
        remaining: quota.aiCallsDailyLimit - quota.aiCallsDaily,
      },
      storage: {
        used: quota.storageUsed,
        limit: quota.storageLimit,
        remaining: quota.storageLimit - quota.storageUsed,
      },
      resetAt: quota.resetAt,
    };
  }

  /**
   * 重置用户每日配额（管理员功能）
   */
  async resetDailyQuota(userId: string): Promise<void> {
    await this.quotaRepo.resetDailyUsage(userId);
  }
}
