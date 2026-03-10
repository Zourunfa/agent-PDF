// 游客使用追踪 API
// POST /api/guest/track

import { NextRequest, NextResponse } from 'next/server';
import { generateFingerprint } from '@/lib/auth/fingerprint';
import {
  incrementGuestUsage,
  canGuestProceed,
  getGuestRemaining,
} from '@/lib/storage/guest-storage';

// 强制动态渲染，因为使用了 headers()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pdfId } = body;

    // 验证 action
    if (!action || !['upload', 'chat'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ACTION',
          message: 'Action must be "upload" or "chat"',
        },
        { status: 400 }
      );
    }

    // 生成设备指纹
    const fingerprint = await generateFingerprint();

    // 检查是否可以继续
    const canProceed = await canGuestProceed(fingerprint);

    if (!canProceed) {
      const remaining = await getGuestRemaining(fingerprint);

      return NextResponse.json({
        success: false,
        allowed: false,
        error: 'QUOTA_EXCEEDED',
        message: '您已达到免费试用上限（3次），请注册账户继续使用',
        remaining: 0,
        limit: 3,
        used: 3,
      });
    }

    // 记录使用
    const usage = await incrementGuestUsage(fingerprint, pdfId);
    const remaining = await getGuestRemaining(fingerprint);

    return NextResponse.json({
      success: true,
      allowed: remaining > 0,
      usage: {
        count: usage.count,
        remaining,
        limit: 3,
        pdfIds: usage.pdfIds,
      },
      message: remaining > 0 ? `还可以使用 ${remaining} 次` : '已达到免费试用上限',
    });
  } catch (error) {
    console.error('Error tracking guest usage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to track guest usage',
      },
      { status: 500 }
    );
  }
}
