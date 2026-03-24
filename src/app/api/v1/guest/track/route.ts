/**
 * POST /api/v1/guest/track
 * Track guest usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuotaController } from '@/controllers/quota.controller';

const controller = new QuotaController();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return controller.trackGuestUsage(req as any);
}
