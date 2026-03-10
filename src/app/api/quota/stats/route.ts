/**
 * Quota Statistics API
 *
 * 获取用户的配额使用统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { getUserQuotaStats } from '@/lib/quota/check';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Debug: Log all cookies from request
    const allCookies = req.cookies.getAll();
    console.log(
      '[Quota Stats] Request cookies:',
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value }))
    );

    // 获取用户信息
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

    console.log(`[Quota Stats] Fetching stats for user: ${user.id}`);

    // 获取配额统计
    const stats = await getUserQuotaStats(user.id);

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Quota Stats] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : '获取配额统计失败',
        },
      },
      { status: 500 }
    );
  }
}
