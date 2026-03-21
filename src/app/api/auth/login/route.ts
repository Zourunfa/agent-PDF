// 用户登录 API
// POST /api/auth/login

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '邮箱和密码不能为空',
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 登录用户
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // 设置 session 过期时间（记住我 = 30 天，否则 7 天）
        expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      },
    });

    if (error) {
      console.error('Login error details:', error);

      // 特殊处理邮箱未验证的情况
      if (error.code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          {
            success: false,
            error: 'EMAIL_NOT_VERIFIED',
            message: '请先验证您的邮箱。检查您的收件箱并点击验证链接',
            requireVerification: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '邮箱或密码不正确',
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'LOGIN_FAILED',
          message: '登录失败',
        },
        { status: 500 }
      );
    }

    // 检查用户是否被删除（user_profiles 是否存在）
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, status, email_verified')
      .eq('id', data.user.id)
      .single();

    // 如果 profile 不存在或用户被封禁，拒绝登录
    if (profileError || !profile) {
      console.error('[Login] 用户不存在或已被删除:', email, data.user.id);

      // 清除 session
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          error: 'USER_DELETED',
          message: '该账户已被删除或不存在',
        },
        { status: 401 }
      );
    }

    // 检查用户邮箱是否验证
    if (!profile.email_verified) {
      console.error('[Login] 用户邮箱未验证:', email);

      // 清除 session
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: '请先验证您的邮箱。检查您的收件箱并点击验证链接',
          requireVerification: true,
        },
        { status: 403 }
      );
    }

    // 检查用户状态
    if (profile.status === 'suspended') {
      console.error('[Login] 用户已被封禁:', email);

      // 清除 session
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          error: 'USER_SUSPENDED',
          message: '该账户已被封禁',
        },
        { status: 403 }
      );
    }

    // 记录登录日志
    try {
      // 获取设备信息
      const headersList = request.headers;
      const ipAddress =
        headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
        headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        'unknown';

      const userAgent = headersList.get('user-agent') || 'unknown';

      // TODO: 记录到 user_security_log 表
      // await supabase.from('user_security_log').insert({
      //   user_id: data.user.id,
      //   event_type: 'login',
      //   ip_address: ipAddress,
      //   user_agent: userAgent,
      //   success: true,
      // });
    } catch (logError) {
      console.error('Error logging login event:', logError);
    }

    // 创建响应并设置 session cookies
    // Supabase SSR 客户端会自动处理 cookies 的设置
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || 'user',
        avatar: profile?.avatar_url,
        emailVerified: data.user.email_confirmed_at != null,
      },
      message: '登录成功',
    });

    // 重要：Supabase SSR 客户端已经通过 createClient() 中的 cookies 设置
    // 自动将 session 信息写入 cookies，这里不需要手动设置

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '登录失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
