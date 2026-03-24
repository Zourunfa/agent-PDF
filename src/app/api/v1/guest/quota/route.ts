/**
 * GET /api/v1/guest/quota
 * Get guest quota information
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuotaController } from '@/controllers/quota.controller';

const controller = new QuotaController();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return controller.getGuestQuota(req as any);
}
