// 重发验证邮件 API
// POST /api/auth/resend-verification
// 为已登录用户重新发送验证邮件

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

/**
 * 简单的内存限流器
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1小时窗口
  const maxRequests = 5; // 最多5次请求

  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
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
    // 获取请求参数
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    console.log('[Resend Verification] 收到请求:', { email, userExists: !!email });

    // 检查用户是否已登录
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[Resend Verification] 用户登录状态:', { user: !!user, authError });

    let profile: any = null;

    // 如果已登录，使用登录用户的信息
    if (user && !authError) {
      console.log('[Resend Verification] 用户已登录，尝试获取 profile');
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, name, email_verified')
        .eq('id', user.id)
        .single();

      console.log('[Resend Verification] Profile 查询结果:', { userProfile, profileError });

      if (userProfile && !profileError) {
        profile = userProfile;
        console.log('[Resend Verification] ✓ 使用登录用户的 profile');
      }
    }

    // 如果未登录或获取失败，尝试使用邮箱
    if (!profile && email) {
      console.log('[Resend Verification] 尝试使用邮箱查找用户:', email);
      const adminClient = createAdminClient();
      const { data: emailProfile, error: emailProfileError } = await adminClient
        .from('user_profiles')
        .select('id, email, name, email_verified')
        .eq('email', email)
        .single();

      console.log('[Resend Verification] 邮箱查询结果:', { emailProfile, emailProfileError });

      if (emailProfile && !emailProfileError) {
        profile = emailProfile;
        console.log('[Resend Verification] ✓ 使用邮箱找到的 profile');
      }
    }

    // 如果仍然没有找到用户
    if (!profile) {
      console.error('[Resend Verification] ❌ 用户未找到');
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: user ? '用户信息不存在' : '请先登录或提供邮箱地址',
        },
        { status: 404 }
      );
    }

    console.log('[Resend Verification] ✓ 用户信息:', profile.email);

    // 检查邮箱是否已验证
    if (profile.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_VERIFIED',
          message: '邮箱已验证，无需重新发送',
        },
        { status: 400 }
      );
    }

    // 检查限流（使用邮箱作为限流标识符）
    if (!checkRateLimit(profile.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: '发送过于频繁，请1小时后再试',
        },
        { status: 429 }
      );
    }

    const adminClient = createAdminClient();

    // 生成新的验证令牌
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    // 更新用户记录
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        email_verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to update verification token:', updateError);
      throw new Error('Failed to generate verification token');
    }

    // 记录安全日志
    try {
      await adminClient.from('user_security_log').insert({
        user_id: profile.id,
        event_type: 'email_verification_resend',
        ip_address:
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          request.headers.get('x-real-ip') ||
          null,
        user_agent: request.headers.get('user-agent') || null,
        success: true,
        details: {},
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    // 发送验证邮件
    const emailResult = await sendVerificationEmail(
      profile.email,
      verificationToken,
      profile.name || undefined
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_SEND_FAILED',
          message: '发送验证邮件失败，请稍后重试',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '验证邮件已发送，请检查您的邮箱',
    });
  } catch (error) {
    console.error('Resend verification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '发送验证邮件时出错，请稍后重试',
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
