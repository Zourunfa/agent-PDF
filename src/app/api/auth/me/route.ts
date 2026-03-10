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
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '未登录',
        },
        { status: 401 }
      );
    }

    // 获取用户 profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      // 如果 profile 不存在，仍然返回用户信息
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          role: 'user',
          avatar: null,
          emailVerified: user.email_confirmed_at != null,
          createdAt: user.created_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name,
        role: profile?.role || 'user',
        avatar: profile?.avatar_url,
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
