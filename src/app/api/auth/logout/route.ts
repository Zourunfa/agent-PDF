// 用户登出 API
// POST /api/auth/logout

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 登出用户
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'LOGOUT_FAILED',
          message: '登出失败',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '登出失败',
      },
      { status: 500 }
    );
  }
}
