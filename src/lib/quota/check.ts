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
  quotaName: 'pdf_uploads_daily' | 'ai_calls_daily'
): Promise<QuotaDefinition | null> {
  const supabase = await createClient();

  // 首先检查用户是否有自定义配额
  const { data: userQuota, error: userError } = await supabase
    .from('user_quotas')
    .select('quota_id')
    .eq('user_id', userId)
    .eq('quota_definitions.name', quotaName)
    .single();

  if (!userError && userQuota) {
    // 获取该配额的定义
    const { data: quotaDef, error: defError } = await supabase
      .from('quota_definitions')
      .select('*')
      .eq('id', userQuota.quota_id)
      .single();

    if (!defError && quotaDef) {
      return quotaDef;
    }
  }

  // 使用默认配额
  const { data: defaultQuota, error: defaultError } = await supabase
    .from('quota_definitions')
    .select('*')
    .eq('name', quotaName)
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
  quotaName: 'pdf_uploads_daily' | 'ai_calls_daily'
): Promise<number> {
  const supabase = await createClient();

  // 获取配额定义的 ID
  const { data: quotaDef, error: defError } = await supabase
    .from('quota_definitions')
    .select('id')
    .eq('name', quotaName)
    .single();

  if (defError || !quotaDef) {
    console.error('[Quota] Error fetching quota definition:', defError);
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('quota_usage')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('quota_id', quotaDef.id)
    .eq('usage_date', today.toISOString().split('T')[0]);

  if (error) {
    console.error('[Quota] Error fetching usage:', error);
    return 0;
  }

  return data?.reduce((sum, record) => sum + (record.usage_count || 0), 0) || 0;
}

/**
 * 检查用户是否可以上传 PDF
 */
export async function canUploadPDF(userId: string): Promise<QuotaCheckResult> {
  const quotaDef = await getUserQuotaDefinition(userId, 'pdf_uploads_daily');

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

  const used = await getUserUsageToday(userId, 'pdf_uploads_daily');
  const remaining = Math.max(0, quotaDef.default_limit - used);

  return {
    allowed: remaining > 0,
    quotaLimit: quotaDef.default_limit,
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
  const quotaDef = await getUserQuotaDefinition(userId, 'ai_calls_daily');

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

  const used = await getUserUsageToday(userId, 'ai_calls_daily');
  const remaining = Math.max(0, quotaDef.default_limit - used);

  return {
    allowed: remaining > 0,
    quotaLimit: quotaDef.default_limit,
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
  quotaName: 'pdf_uploads_daily' | 'ai_calls_daily',
  amount: number = 1,
  resourceId?: string
): Promise<void> {
  const supabase = await createClient();

  // 获取配额定义的 ID
  const { data: quotaDef, error: defError } = await supabase
    .from('quota_definitions')
    .select('id')
    .eq('name', quotaName)
    .single();

  if (defError || !quotaDef) {
    console.error('[Quota] Error fetching quota definition:', defError);
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Use upsert to handle duplicate key errors (increment if exists, insert if not)
  const { data: existing } = await supabase
    .from('quota_usage')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('quota_id', quotaDef.id)
    .eq('usage_date', today)
    .maybeSingle();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('quota_usage')
      .update({ usage_count: existing.usage_count + amount })
      .eq('user_id', userId)
      .eq('quota_id', quotaDef.id)
      .eq('usage_date', today);

    if (error) {
      console.error('[Quota] Error updating usage:', error);
    } else {
      console.log(
        `[Quota] ✓ Updated usage to ${existing.usage_count + amount} for ${quotaName} (user: ${userId})`
      );
    }
  } else {
    // Insert new record
    const { error } = await supabase.from('quota_usage').insert({
      user_id: userId,
      quota_id: quotaDef.id,
      usage_date: today,
      usage_count: amount,
    });

    if (error) {
      console.error('[Quota] Error recording usage:', error);
    } else {
      console.log(`[Quota] ✓ Recorded ${amount} usage for ${quotaName} (user: ${userId})`);
    }
  }
}

/**
 * 获取用户配额统计
 */
export async function getUserQuotaStats(userId: string) {
  const [uploadQuota, chatQuota] = await Promise.all([canUploadPDF(userId), canChat(userId)]);

  return {
    upload: uploadQuota,
    chat: chatQuota,
  };
}
