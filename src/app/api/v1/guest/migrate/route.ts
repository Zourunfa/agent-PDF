/**
 * POST /api/v1/guest/migrate
 * Migrate guest data to user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuotaController } from '@/controllers/quota.controller';

const controller = new QuotaController();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return controller.migrateGuestData(req as any);
}
