/**
 * PDF Parse API Route
 * POST /api/v1/parse - Parse PDF file
 * GET /api/v1/parse - Get parse status
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFController } from '@/controllers/pdf.controller';

const controller = new PDFController();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return controller.parse(req as any);
}

export async function GET(req: NextRequest) {
  return controller.getParseStatus(req as any);
}
