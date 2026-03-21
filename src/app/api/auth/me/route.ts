// 获取当前用户信息 API
// GET /api/auth/me

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 获取当前用户
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);

      // 如果是用户不存在错误（被删除），清除无效的 token
      const response = NextResponse.json(
        {
          success: false,
          error: userError?.code === 'user_not_found' ? 'USER_DELETED' : 'UNAUTHORIZED',
          message: userError?.code === 'user_not_found'
            ? '用户已被删除，请重新登录'
            : '未登录',
        },
        { status: 401 }
      );

      // 清除无效的 session cookie
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');

      return response;
    }

    // 获取用户 profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 如果 profile 不存在（用户被删除或封禁），返回 401
    if (profileError || !profile) {
      console.error('[Auth] Profile not found for user:', user.id, profileError);
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用户不存在或已被封禁',
        },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (profile.status === 'suspended') {
      console.error('[Auth] User is suspended:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'USER_SUSPENDED',
          message: '用户已被封禁',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name,
        role: profile?.role || 'user',
        avatar: profile?.avatar_url,
        emailVerified: profile?.email_verified || false,
        email_verified: profile?.email_verified || false, // 添加备用字段
        createdAt: user.created_at,
        // profile 表的其他字段
        avatar_url: profile?.avatar_url,
        status: profile?.status,
        created_at: profile?.created_at,
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
