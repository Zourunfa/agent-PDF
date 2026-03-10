/**
 * User Profile API
 *
 * 获取和更新用户资料
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

// GET /api/user/profile - 获取用户资料
export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.profile?.name || user.user_metadata?.name,
        avatar: user.profile?.avatar_url,
        role: user.profile?.role || 'user',
        emailVerified: user.email_confirmed_at != null,
        status: user.profile?.status || 'active',
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '获取用户资料失败',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - 更新用户资料
export async function PUT(request: NextRequest) {
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
    const { name } = body;

    // 验证输入
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '请输入有效的姓名',
          },
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '姓名长度不能超过100个字符',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 更新用户资料
    const { error } = await supabase
      .from('user_profiles')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('[Profile API] Update error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: '更新用户资料失败',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '资料更新成功',
      data: {
        name: name.trim(),
      },
    });
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '更新用户资料失败',
        },
      },
      { status: 500 }
    );
  }
}
