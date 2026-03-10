// 获取当前用户信息 API
// GET /api/auth/me

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '未登录',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.name || user.user_metadata?.name,
        role: user.profile?.role || 'user',
        avatar: user.profile?.avatar_url,
        emailVerified: user.email_confirmed_at != null,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching user info:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '获取用户信息失败',
      },
      { status: 500 }
    );
  }
}
