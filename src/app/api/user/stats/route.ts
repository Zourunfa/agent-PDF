/**
 * User Statistics API
 *
 * 获取用户使用统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

// GET /api/user/stats - 获取用户统计
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录',
          },
        },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // 获取总上传次数
    const { count: totalUploads, error: uploadError } = await supabase
      .from('user_pdfs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (uploadError) {
      console.error('[Stats API] Upload count error:', uploadError);
    }

    // 获取今日上传次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayUploads, error: todayUploadError } = await supabase
      .from('user_pdfs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    if (todayUploadError) {
      console.error('[Stats API] Today upload count error:', todayUploadError);
    }

    // 获取聊天次数（从 quota_usage 表）
    const { data: quotaUsage, error: quotaError } = await supabase
      .from('quota_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (quotaError) {
      console.error('[Stats API] Quota usage error:', quotaError);
    }

    // 计算聊天次数
    const totalChats = quotaUsage?.filter((u) => u.quota_type === 'ai_calls').length || 0;
    const todayChats =
      quotaUsage?.filter((u) => u.quota_type === 'ai_calls' && new Date(u.created_at) >= today)
        .length || 0;

    // 获取最近活动
    const recentActivity =
      quotaUsage?.slice(0, 10).map((activity) => ({
        type: activity.quota_type,
        timestamp: activity.created_at,
        amount: activity.amount,
      })) || [];

    // 获取历史趋势（最近7天）
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayUploads = await supabase
        .from('user_pdfs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      const dayChats =
        quotaUsage?.filter(
          (u) =>
            u.quota_type === 'ai_calls' &&
            new Date(u.created_at) >= date &&
            new Date(u.created_at) < nextDate
        ).length || 0;

      last7Days.push({
        date: date.toISOString().split('T')[0],
        uploads: dayUploads.count || 0,
        chats: dayChats,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        total: {
          uploads: totalUploads || 0,
          chats: totalChats,
        },
        today: {
          uploads: todayUploads || 0,
          chats: todayChats,
        },
        history: last7Days,
        recentActivity,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Stats API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '获取用户统计失败',
        },
      },
      { status: 500 }
    );
  }
}
