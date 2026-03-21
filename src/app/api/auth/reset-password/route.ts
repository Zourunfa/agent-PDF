// 重置密码 API
// POST /api/auth/reset-password
// 验证令牌并更新密码

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 验证输入
    if (!token || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '令牌和新密码不能为空',
        },
        { status: 400 }
      );
    }

    // 验证密码强度
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'WEAK_PASSWORD',
          message: '密码至少需要8位',
        },
        { status: 400 }
      );
    }

    if (!/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'WEAK_PASSWORD',
          message: '密码必须包含字母和数字',
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 验证令牌并获取用户信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, reset_expires_at')
      .eq('password_reset_token', token)
      .single();

    if (profileError || !profile) {
      // 记录失败的安全日志
      try {
        await supabase.from('user_security_log').insert({
          user_id: null,
          event_type: 'password_reset_failed',
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
          message: '无效的重置令牌',
        },
        { status: 400 }
      );
    }

    // 检查令牌是否过期
    if (profile.reset_expires_at) {
      const expiresAt = new Date(profile.reset_expires_at);
      if (expiresAt < new Date()) {
        // 记录失败的安全日志
        try {
          await supabase.from('user_security_log').insert({
            user_id: profile.id,
            event_type: 'password_reset_failed',
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
            message: '重置令牌已过期，请重新申请',
          },
          { status: 400 }
        );
      }
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Failed to update password:', updateError);
      throw new Error('Failed to update password');
    }

    // 清除重置令牌
    await supabase
      .from('user_profiles')
      .update({
        password_reset_token: null,
        reset_expires_at: null,
      })
      .eq('id', profile.id);

    // 记录安全日志
    try {
      await supabase.from('user_security_log').insert({
        user_id: profile.id,
        event_type: 'password_reset',
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
      message: '密码已成功重置，请使用新密码登录',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '重置密码时出错，请稍后重试',
      },
      { status: 500 }
    );
  }
}

// 禁用 GET 方法
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: '请使用 POST 方法',
    },
    { status: 405 }
  );
}
