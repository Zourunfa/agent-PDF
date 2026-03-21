// 邮箱验证 API
// POST /api/auth/verify-email
// 验证邮箱令牌并更新验证状态

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // 验证输入
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '验证令牌不能为空',
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 验证令牌并获取用户信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, verification_expires_at')
      .eq('email_verification_token', token)
      .single();

    if (profileError || !profile) {
      // 记录失败的安全日志
      try {
        await supabase.from('user_security_log').insert({
          user_id: null,
          event_type: 'email_verification_failed',
          ip_address:
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            null,
          user_agent: request.headers.get('user-agent') || null,
          success: false,
          details: { reason: 'invalid_token' },
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TOKEN',
          message: '无效的验证令牌',
        },
        { status: 400 }
      );
    }

    // 检查令牌是否过期
    if (profile.verification_expires_at) {
      const expiresAt = new Date(profile.verification_expires_at);
      if (expiresAt < new Date()) {
        // 记录失败的安全日志
        try {
          await supabase.from('user_security_log').insert({
            user_id: profile.id,
            event_type: 'email_verification_failed',
            ip_address:
              request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
              request.headers.get('x-real-ip') ||
              null,
            user_agent: request.headers.get('user-agent') || null,
            success: false,
            details: { reason: 'token_expired' },
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        return NextResponse.json(
          {
            success: false,
            error: 'TOKEN_EXPIRED',
            message: '验证令牌已过期，请重新发送验证邮件',
          },
          { status: 400 }
        );
      }
    }

    // 更新邮箱验证状态
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        verification_expires_at: null,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to update email verification status:', updateError);
      throw new Error('Failed to update verification status');
    }

    // 同时更新 auth.users 的 email_confirmed_at
    await supabase.auth.admin.updateUserById(profile.id, {
      email_confirm: true,
    });

    // 记录安全日志
    try {
      await supabase.from('user_security_log').insert({
        user_id: profile.id,
        event_type: 'email_verified',
        ip_address:
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          request.headers.get('x-real-ip') ||
          null,
        user_agent: request.headers.get('user-agent') || null,
        success: true,
        details: { method: 'email_token' },
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    return NextResponse.json({
      success: true,
      message: '邮箱验证成功',
    });
  } catch (error) {
    console.error('Email verification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '验证邮箱时出错，请稍后重试',
      },
      { status: 500 }
    );
  }
}

// GET 方法用于从验证页面直接调用
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/verify-email?error=missing_token', request.url));
    }

    // 使用 POST 逻辑处理验证
    const response = await POST(
      new Request(request.url, {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );

    const data = await response.json();

    if (data.success) {
      return NextResponse.redirect(new URL('/verify-email?success=true', request.url));
    } else {
      return NextResponse.redirect(new URL(`/verify-email?error=${data.error}`, request.url));
    }
  } catch (error) {
    console.error('Email verification GET error:', error);
    return NextResponse.redirect(new URL('/verify-email?error=internal_error', request.url));
  }
}
