/**
 * Change Password API
 *
 * 修改用户密码
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

// POST /api/user/change-password - 修改密码
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 验证输入
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '请提供当前密码和新密码',
          },
        },
        { status: 400 }
      );
    }

    // 验证新密码强度
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: '新密码长度至少为8个字符',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 验证当前密码
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: '当前密码不正确',
          },
        },
        { status: 400 }
      );
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('[Change Password API] Update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: '密码修改失败',
          },
        },
        { status: 500 }
      );
    }

    // 记录安全日志
    await supabase.from('user_security_log').insert({
      user_id: user.id,
      event_type: 'password_changed',
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: '密码修改成功，请重新登录',
    });
  } catch (error) {
    console.error('[Change Password API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '密码修改失败',
        },
      },
      { status: 500 }
    );
  }
}
