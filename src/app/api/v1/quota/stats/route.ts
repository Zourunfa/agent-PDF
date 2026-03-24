/**
 * GET /api/v1/quota/stats
 * Get user quota statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuotaController } from '@/controllers/quota.controller';

const controller = new QuotaController();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return controller.getUserQuotaStats(req as any);
}
