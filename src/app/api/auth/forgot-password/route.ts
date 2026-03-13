// 忘记密码 API
// POST /api/auth/forgot-password
// 发送密码重置邮件

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email-mailersend';
import { randomUUID } from 'crypto';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * 简单的内存限流器
 * 生产环境建议使用 Redis 或专业的限流服务
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15分钟窗口
  const maxRequests = 3; // 最多3次请求

  const record = rateLimitMap.get(email);

  if (!record || now > record.resetTime) {
    // 创建新记录
    rateLimitMap.set(email, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 验证输入
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '邮箱地址不能为空',
        },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_EMAIL',
          message: '邮箱格式不正确',
        },
        { status: 400 }
      );
    }

    // 检查限流
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请15分钟后再试',
        },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // 检查邮箱是否存在
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      // 为了安全，不暴露邮箱是否已注册
      // 但仍返回成功消息，防止邮箱枚举攻击
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件',
      });
    }

    // 生成重置令牌
    const resetToken = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    // 更新用户记录
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        password_reset_token: resetToken,
        reset_expires_at: expiresAt.toISOString(),
      } as any)
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to update password reset token:', updateError);
      throw new Error('Failed to generate reset token');
    }

    // 记录安全日志
    try {
      await (supabase.from('user_security_log') as any).insert({
        user_id: profile.id,
        event_type: 'password_reset_requested',
        ip_address:
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          request.headers.get('x-real-ip') ||
          null,
        user_agent: request.headers.get('user-agent') || null,
        success: true,
        details: { method: 'email' },
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    // 发送密码重置邮件
    const emailResult = await sendPasswordResetEmail(email, resetToken, profile.name || undefined);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // 仍然返回成功，因为令牌已生成
      // 可以在后台重试发送邮件
    }

    // 为了安全，始终返回成功消息
    return NextResponse.json({
      success: true,
      message: '如果该邮箱已注册，您将收到密码重置邮件',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '处理请求时出错，请稍后重试',
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
