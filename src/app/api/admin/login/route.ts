/**
 * Admin Login API Route
 * 管理员登录接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    console.log('[Admin Login] 尝试登录:', username);

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '用户名和密码不能为空',
          },
        },
        { status: 400 }
      );
    }

    // 执行登录
    const result = adminLogin(username, password);

    if (result.success) {
      console.log('[Admin Login] ✓ 登录成功');
      return NextResponse.json({
        success: true,
        data: {
          token: result.token,
        },
      });
    }

    console.log('[Admin Login] ✗ 登录失败');
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: result.error,
        },
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '登录失败',
        },
      },
      { status: 500 }
    );
  }
}
