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

    // 步骤1: 检查 auth.users 中是否已存在该邮箱（包括被软删除的用户）
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find((u) => u.email === email);

    // 步骤2: 检查 user_profiles
    let existingProfile = null;
    if (existingAuthUser) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .maybeSingle();
      existingProfile = data;
    }

    // 如果 auth.users 中存在且有 user_profiles，说明是真正已注册的用户
    if (existingAuthUser && existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: '该邮箱已被注册',
        },
        { status: 409 }
      );
    }

    // 如果 auth.users 中存在但没有 user_profiles，说明是"幽灵"用户（被删除但未清理）
    if (existingAuthUser && !existingProfile) {
      console.log('[Register] 检测到幽灵用户，先清理 auth.users 记录:', email);
      await supabase.auth.admin.deleteUser(existingAuthUser.id);
      console.log('[Register] ✓ 幽灵用户已清理');
    }

    // 创建用户
    let authData = { user: null, session: null };
    let authError = null;

    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 开发环境：自动确认邮箱
        user_metadata: {
          name: name || email.split('@')[0],
        },
      });
      authData = result.data;
      authError = result.error;
    } catch (e) {
      authError = e;
    }

    if (authError) {
      // 处理邮箱已存在的情况
      if (
        authError.message?.includes('already been registered') ||
        authError.message?.includes('A user with this email address has already been registered')
      ) {
        // 检查是否是被删除的用户（auth.users 存在但 user_profiles 不存在）
        const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers?.users?.find((u) => u.email === email);

        if (existingAuthUser) {
          // 检查 user_profiles 是否存在
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', existingAuthUser.id)
            .single();

          if (!existingProfile) {
            // 这是被删除的用户，直接复用已有的 auth.users 记录，重新创建 user_profiles
            console.log(
              '[Register] 检测到被删除的用户，复用 auth.users 记录重新创建 profile:',
              email
            );

            // 手动创建 user_profiles 记录
            const verificationToken = randomUUID();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const { error: insertProfileError } = await supabase.from('user_profiles').insert({
              id: existingAuthUser.id,
              email: existingAuthUser.email,
              name: name || email.split('@')[0],
              role: 'user',
              email_verified: false,
              status: 'active',
              email_verification_token: verificationToken,
              verification_expires_at: expiresAt.toISOString(),
            });

            if (insertProfileError) {
              console.error('[Register] 创建 user_profiles 失败:', insertProfileError);
              throw new Error('注册失败，请稍后重试');
            }

            // 发送验证邮件
            const emailResult = await sendVerificationEmail(
              email,
              verificationToken,
              name || undefined
            );

            return NextResponse.json({
              success: true,
              message: emailResult.success
                ? '注册成功！请检查您的邮箱并点击验证链接完成注册'
                : emailResult.developmentMode
                  ? '注册成功！开发模式下邮件已跳过（仍需验证邮箱）'
                  : '注册成功！邮件发送失败，请稍后在用户中心重新发送验证邮件',
              requireVerification: true, // 始终需要验证
              emailSent: emailResult.success,
              developmentMode: emailResult.developmentMode || false,
              user: {
                id: existingAuthUser.id,
                email: existingAuthUser.email,
                name: name || email.split('@')[0],
                emailVerified: false, // 始终未验证
              },
            });
          } else {
            // user_profiles 存在，是真正的重复注册
            return NextResponse.json(
              {
                success: false,
                error: 'EMAIL_ALREADY_EXISTS',
                message: '该邮箱已被注册',
              },
              { status: 409 }
            );
          }
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'EMAIL_ALREADY_EXISTS',
              message: '该邮箱已被注册',
            },
            { status: 409 }
          );
        }
      } else {
        throw authError;
      }
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // 手动创建 user_profiles（可能已被触发器创建）
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    console.log('[Register] 准备创建/更新 user_profiles:', authData.user.id);

    // 使用 upsert 操作：如果存在就更新，不存在就插入
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: 'user',
          email_verified: true, // 开发环境：自动验证
          status: 'active',
          email_verification_token: verificationToken,
          verification_expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'id', // 主键冲突时更新
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error('[Register] upsert user_profiles 失败:', upsertError);
    } else {
      console.log('[Register] ✓ user_profiles 创建/更新成功');
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

    return NextResponse.json({
      success: true,
      message: emailResult.success
        ? '注册成功！请检查您的邮箱并点击验证链接完成注册'
        : emailResult.developmentMode
          ? '注册成功！开发模式下邮件已跳过（仍需验证邮箱）'
          : '注册成功！邮件发送失败，请稍后在用户中心重新发送验证邮件',
      requireVerification: false, // 开发环境：不需要验证
      emailSent: emailResult.success,
      developmentMode: emailResult.developmentMode || false,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name,
        emailVerified: true, // 开发环境：已自动验证
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
