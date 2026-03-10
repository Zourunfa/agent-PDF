// 游客数据迁移 API
// POST /api/guest/migrate
// 用于游客注册后迁移历史数据到新账户

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFingerprint } from '@/lib/auth/fingerprint';
import { migrateGuestData } from '@/lib/storage/guest-storage';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestFingerprint } = body;

    // 验证用户已登录
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '您需要先登录',
        },
        { status: 401 }
      );
    }

    // 验证指纹
    if (!guestFingerprint) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_FINGERPRINT',
          message: '缺少游客指纹',
        },
        { status: 400 }
      );
    }

    // 迁移数据
    const result = await migrateGuestData(guestFingerprint, user.id);

    return NextResponse.json({
      success: true,
      message: '数据迁移成功',
      migratedPdfs: result.migratedPdfs,
    });
  } catch (error) {
    console.error('Error migrating guest data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '迁移失败',
      },
      { status: 500 }
    );
  }
}
