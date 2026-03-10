/**
 * Quota Checking Utilities
 *
 * 检查用户配额和使用情况
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type QuotaDefinition = Database['public']['Tables']['quota_definitions']['Row'];
type QuotaUsageRow = Database['public']['Tables']['quota_usage']['Row'];

/**
 * 配额检查结果
 */
export interface QuotaCheckResult {
  allowed: boolean;
  quotaLimit: number;
  used: number;
  remaining: number;
  quotaType: 'daily' | 'monthly';
  reason?: string;
}

/**
 * 获取用户的配额定义
 */
async function getUserQuotaDefinition(
  userId: string,
  quotaType: 'pdf_upload_daily' | 'pdf_chat_daily'
): Promise<QuotaDefinition | null> {
  const supabase = await createClient();

  // 首先检查用户是否有自定义配额
  const { data: customQuota, error: customError } = await supabase
    .from('user_quotas')
    .select(`
      quota_definitions (*)
    `)
    .eq('user_id', userId)
    .eq('quota_type', quotaType)
    .single();

  if (!customError && customQuota) {
    return customQuota.quota_definitions as QuotaDefinition;
  }

  // 使用默认配额
  const { data: defaultQuota, error: defaultError } = await supabase
    .from('quota_definitions')
    .select('*')
    .eq('quota_type', quotaType)
    .eq('is_default', true)
    .single();

  if (defaultError) {
    console.error('[Quota] Error fetching default quota:', defaultError);
    return null;
  }

  return defaultQuota;
}

/**
 * 获取用户今日使用量
 */
async function getUserUsageToday(
  userId: string,
  quotaType: 'pdf_upload_daily' | 'pdf_chat_daily'
): Promise<number> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('quota_usage')
    .select('amount')
    .eq('user_id', userId)
    .eq('quota_type', quotaType)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('[Quota] Error fetching usage:', error);
    return 0;
  }

  return data?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
}

/**
 * 检查用户是否可以上传 PDF
 */
export async function canUploadPDF(userId: string): Promise<QuotaCheckResult> {
  const quotaDef = await getUserQuotaDefinition(userId, 'pdf_upload_daily');

  if (!quotaDef) {
    console.error('[Quota] No quota definition found for PDF upload');
    return {
      allowed: false,
      quotaLimit: 0,
      used: 0,
      remaining: 0,
      quotaType: 'daily',
      reason: '配额未配置，请联系管理员',
    };
  }

  const used = await getUserUsageToday(userId, 'pdf_upload_daily');
  const remaining = Math.max(0, quotaDef.quota_limit - used);

  return {
    allowed: remaining > 0,
    quotaLimit: quotaDef.quota_limit,
    used,
    remaining,
    quotaType: 'daily',
    reason: remaining === 0 ? '今日上传次数已达上限' : undefined,
  };
}

/**
 * 检查用户是否可以进行聊天
 */
export async function canChat(userId: string): Promise<QuotaCheckResult> {
  const quotaDef = await getUserQuotaDefinition(userId, 'pdf_chat_daily');

  if (!quotaDef) {
    console.error('[Quota] No quota definition found for chat');
    return {
      allowed: false,
      quotaLimit: 0,
      used: 0,
      remaining: 0,
      quotaType: 'daily',
      reason: '配额未配置，请联系管理员',
    };
  }

  const used = await getUserUsageToday(userId, 'pdf_chat_daily');
  const remaining = Math.max(0, quotaDef.quota_limit - used);

  return {
    allowed: remaining > 0,
    quotaLimit: quotaDef.quota_limit,
    used,
    remaining,
    quotaType: 'daily',
    reason: remaining === 0 ? '今日聊天次数已达上限' : undefined,
  };
}

/**
 * 记录配额使用
 */
export async function recordQuotaUsage(
  userId: string,
  quotaType: 'pdf_upload_daily' | 'pdf_chat_daily',
  amount: number = 1,
  resourceId?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('quota_usage').insert({
    user_id: userId,
    quota_type: quotaType,
    amount,
    resource_id: resourceId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Quota] Error recording usage:', error);
  } else {
    console.log(`[Quota] ✓ Recorded ${amount} usage for ${quotaType} (user: ${userId})`);
  }
}

/**
 * 获取用户配额统计
 */
export async function getUserQuotaStats(userId: string) {
  const [uploadQuota, chatQuota] = await Promise.all([
    canUploadPDF(userId),
    canChat(userId),
  ]);

  return {
    upload: uploadQuota,
    chat: chatQuota,
  };
}
