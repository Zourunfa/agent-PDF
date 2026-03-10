// 游客配额查询 API
// GET /api/guest/quota

import { NextRequest, NextResponse } from 'next/server';
import { generateFingerprint, getDeviceInfo } from '@/lib/auth/fingerprint';
import { getGuestUsage, getGuestRemaining, canGuestProceed } from '@/lib/storage/guest-storage';

// 强制动态渲染，因为使用了 headers()
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 生成设备指纹
    const fingerprint = await generateFingerprint();

    // 获取使用情况
    const usage = await getGuestUsage(fingerprint);
    const remaining = await getGuestRemaining(fingerprint);
    const canProceed = await canGuestProceed(fingerprint);

    return NextResponse.json({
      success: true,
      remaining,
      limit: 3,
      used: usage.count,
      canProceed,
      usage: {
        count: usage.count,
        pdfIds: usage.pdfIds,
        lastUsed: usage.lastUsed,
      },
    });
  } catch (error) {
    console.error('Error getting guest quota:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get guest quota',
      },
      { status: 500 }
    );
  }
}
