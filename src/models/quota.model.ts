/**
 * 配额类型枚举
 */
export type QuotaType = 'pdf_uploads_daily' | 'ai_calls_daily' | 'storage_total';

/**
 * 用户配额模型
 */
export interface Quota {
  id: string;
  userId: string;
  pdfUploadsDaily: number;
  pdfUploadsDailyLimit: number;
  aiCallsDaily: number;
  aiCallsDailyLimit: number;
  storageUsed: number;
  storageLimit: number;
  resetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 配额使用记录
 */
export interface QuotaUsage {
  id: string;
  userId: string;
  quotaType: QuotaType;
  amount: number;
  createdAt: Date;
}

/**
 * 配额检查结果
 */
export interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date | null;
  reason?: string;
}

/**
 * 配额消耗结果
 */
export interface QuotaConsumeResult extends QuotaCheckResult {
  consumed: boolean;
  newAmount: number;
}

/**
 * 数据库记录到 Quota 模型的映射
 */
export function mapDbToQuota(data: Record<string, unknown>): Quota {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    pdfUploadsDaily: (data.pdf_uploads_daily as number) || 0,
    pdfUploadsDailyLimit: (data.pdf_uploads_daily_limit as number) || 3,
    aiCallsDaily: (data.ai_calls_daily as number) || 0,
    aiCallsDailyLimit: (data.ai_calls_daily_limit as number) || 10,
    storageUsed: (data.storage_used as number) || 0,
    storageLimit: (data.storage_limit as number) || 100 * 1024 * 1024, // 100MB default
    resetAt: new Date(data.reset_at as string),
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Quota 模型到数据库记录的映射
 */
export function mapQuotaToDb(quota: Partial<Quota>): Record<string, unknown> {
  return {
    id: quota.id,
    user_id: quota.userId,
    pdf_uploads_daily: quota.pdfUploadsDaily,
    pdf_uploads_daily_limit: quota.pdfUploadsDailyLimit,
    ai_calls_daily: quota.aiCallsDaily,
    ai_calls_daily_limit: quota.aiCallsDailyLimit,
    storage_used: quota.storageUsed,
    storage_limit: quota.storageLimit,
    reset_at: quota.resetAt?.toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * 获取默认配额设置
 */
export function getDefaultQuota(userId: string): Omit<Quota, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    userId,
    pdfUploadsDaily: 0,
    pdfUploadsDailyLimit: 3,
    aiCallsDaily: 0,
    aiCallsDailyLimit: 10,
    storageUsed: 0,
    storageLimit: 100 * 1024 * 1024, // 100MB
    resetAt: tomorrow,
  };
}
