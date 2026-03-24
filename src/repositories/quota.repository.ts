import { createClient } from '@/lib/supabase/server';
import type {
  Quota,
  QuotaType,
  QuotaCheckResult,
  QuotaConsumeResult,
} from '@/models/quota.model';
import { mapDbToQuota, getDefaultQuota } from '@/models/quota.model';
import { DatabaseError } from '@/lib/utils/errors';

/**
 * 配额数据访问层
 * 封装所有配额相关的数据库操作
 */
export class QuotaRepository {
  /**
   * 获取用户配额
   * 如果不存在则创建默认配额
   */
  async getQuota(userId: string): Promise<Quota> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 配额不存在，创建默认配额
          return this.createDefaultQuota(userId);
        }
        throw new DatabaseError(`Failed to fetch quota: ${error.message}`);
      }

      return mapDbToQuota(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch quota');
    }
  }

  /**
   * 创建默认配额
   */
  async createDefaultQuota(userId: string): Promise<Quota> {
    try {
      const supabase = await createClient();
      const defaultQuota = getDefaultQuota(userId);

      const { data, error } = await supabase
        .from('user_quotas')
        .insert({
          user_id: userId,
          pdf_uploads_daily: defaultQuota.pdfUploadsDaily,
          pdf_uploads_daily_limit: defaultQuota.pdfUploadsDailyLimit,
          ai_calls_daily: defaultQuota.aiCallsDaily,
          ai_calls_daily_limit: defaultQuota.aiCallsDailyLimit,
          storage_used: defaultQuota.storageUsed,
          storage_limit: defaultQuota.storageLimit,
          reset_at: defaultQuota.resetAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create default quota: ${error.message}`);
      }

      return mapDbToQuota(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create default quota');
    }
  }

  /**
   * 检查配额是否可用
   */
  async checkQuota(
    userId: string,
    quotaType: QuotaType
  ): Promise<QuotaCheckResult> {
    try {
      const quota = await this.getQuota(userId);

      // 检查是否需要重置每日配额
      if (quota.resetAt && new Date() >= quota.resetAt) {
        await this.resetDailyUsage(userId);
        return this.checkQuota(userId, quotaType);
      }

      switch (quotaType) {
        case 'pdf_uploads_daily': {
          const remaining = quota.pdfUploadsDailyLimit - quota.pdfUploadsDaily;
          return {
            allowed: remaining > 0,
            current: quota.pdfUploadsDaily,
            limit: quota.pdfUploadsDailyLimit,
            remaining,
            resetAt: quota.resetAt,
            reason: remaining <= 0 ? 'Daily PDF upload limit exceeded' : undefined,
          };
        }

        case 'ai_calls_daily': {
          const remaining = quota.aiCallsDailyLimit - quota.aiCallsDaily;
          return {
            allowed: remaining > 0,
            current: quota.aiCallsDaily,
            limit: quota.aiCallsDailyLimit,
            remaining,
            resetAt: quota.resetAt,
            reason: remaining <= 0 ? 'Daily AI calls limit exceeded' : undefined,
          };
        }

        case 'storage_total': {
          const remaining = quota.storageLimit - quota.storageUsed;
          return {
            allowed: remaining > 0,
            current: quota.storageUsed,
            limit: quota.storageLimit,
            remaining,
            resetAt: null,
            reason: remaining <= 0 ? 'Storage limit exceeded' : undefined,
          };
        }

        default:
          throw new DatabaseError(`Unknown quota type: ${quotaType}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to check quota');
    }
  }

  /**
   * 消耗配额
   */
  async consumeQuota(
    userId: string,
    quotaType: QuotaType,
    amount: number = 1
  ): Promise<QuotaConsumeResult> {
    try {
      const supabase = await createClient();

      // 先检查配额
      const checkResult = await this.checkQuota(userId, quotaType);
      if (!checkResult.allowed) {
        return {
          ...checkResult,
          consumed: false,
          newAmount: checkResult.current,
        };
      }

      // 更新配额
      let updateField: string;
      switch (quotaType) {
        case 'pdf_uploads_daily':
          updateField = 'pdf_uploads_daily';
          break;
        case 'ai_calls_daily':
          updateField = 'ai_calls_daily';
          break;
        case 'storage_total':
          updateField = 'storage_used';
          break;
        default:
          throw new DatabaseError(`Unknown quota type: ${quotaType}`);
      }

      const { error } = await supabase.rpc('increment_quota', {
        p_user_id: userId,
        p_field: updateField,
        p_amount: amount,
      });

      // 如果 RPC 不存在，使用直接更新
      if (error && error.code === 'PGRST202') {
        const quota = await this.getQuota(userId);
        const newValue = (quota as Record<string, number>)[updateField] + amount;

        await supabase
          .from('user_quotas')
          .update({
            [updateField]: newValue,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else if (error) {
        throw new DatabaseError(`Failed to consume quota: ${error.message}`);
      }

      return {
        ...checkResult,
        consumed: true,
        newAmount: checkResult.current + amount,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to consume quota');
    }
  }

  /**
   * 重置每日使用量
   */
  async resetDailyUsage(userId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // 计算下一个重置时间（明天 0 点）
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const { error } = await supabase
        .from('user_quotas')
        .update({
          pdf_uploads_daily: 0,
          ai_calls_daily: 0,
          reset_at: tomorrow.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(`Failed to reset daily usage: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to reset daily usage');
    }
  }

  /**
   * 增加存储使用量
   */
  async incrementStorage(userId: string, bytes: number): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.rpc('increment_storage', {
        p_user_id: userId,
        p_bytes: bytes,
      });

      // 如果 RPC 不存在，使用直接更新
      if (error && error.code === 'PGRST202') {
        const quota = await this.getQuota(userId);
        await supabase
          .from('user_quotas')
          .update({
            storage_used: quota.storageUsed + bytes,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else if (error) {
        throw new DatabaseError(`Failed to increment storage: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to increment storage');
    }
  }

  /**
   * 减少存储使用量
   */
  async decrementStorage(userId: string, bytes: number): Promise<void> {
    try {
      const supabase = await createClient();
      const quota = await this.getQuota(userId);

      const newStorageUsed = Math.max(0, quota.storageUsed - bytes);

      const { error } = await supabase
        .from('user_quotas')
        .update({
          storage_used: newStorageUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(`Failed to decrement storage: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to decrement storage');
    }
  }

  /**
   * 更新配额限制（管理员功能）
   */
  async updateLimits(
    userId: string,
    limits: {
      pdfUploadsDailyLimit?: number;
      aiCallsDailyLimit?: number;
      storageLimit?: number;
    }
  ): Promise<Quota> {
    try {
      const supabase = await createClient();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (limits.pdfUploadsDailyLimit !== undefined) {
        updateData.pdf_uploads_daily_limit = limits.pdfUploadsDailyLimit;
      }
      if (limits.aiCallsDailyLimit !== undefined) {
        updateData.ai_calls_daily_limit = limits.aiCallsDailyLimit;
      }
      if (limits.storageLimit !== undefined) {
        updateData.storage_limit = limits.storageLimit;
      }

      const { data, error } = await supabase
        .from('user_quotas')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update quota limits: ${error.message}`);
      }

      return mapDbToQuota(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update quota limits');
    }
  }
}
