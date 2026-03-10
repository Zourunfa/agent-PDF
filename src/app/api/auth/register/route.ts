// 用户注册 API
// POST /api/auth/register

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

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

    // 验证密码强度
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'WEAK_PASSWORD',
          message: '密码至少需要8位',
        },
        { status: 400 }
      );
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
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

    // 检查邮箱是否已注册
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: '该邮箱已被注册',
        },
        { status: 409 }
      );
    }

    // 创建用户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 不自动确认邮箱，需要验证
      user_metadata: {
        name: name || email.split('@')[0],
      },
    });

    if (authError) {
      // 处理常见错误
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          {
            success: false,
            error: 'EMAIL_ALREADY_EXISTS',
            message: '该邮箱已被注册',
          },
          { status: 409 }
        );
      }

      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // user_profiles 表会通过触发器自动创建，但我们需要添加验证令牌
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    // 更新用户资料，添加验证令牌
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        email_verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString(),
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Failed to update verification token:', updateError);
      // 继续执行，不阻止注册流程
    }

    // 记录注册安全日志
    try {
      await supabase.from('user_security_log').insert({
        user_id: authData.user.id,
        event_type: 'user_registered',
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

    // 发送验证邮件
    const emailResult = await sendVerificationEmail(email, verificationToken, name || undefined);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // 注册成功但邮件发送失败，记录但不阻止用户
      // 用户可以稍后重新发送验证邮件
    }

    return NextResponse.json({
      success: true,
      message: '注册成功！请检查您的邮箱并点击验证链接完成注册',
      requireVerification: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name,
        emailVerified: false,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '注册失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
