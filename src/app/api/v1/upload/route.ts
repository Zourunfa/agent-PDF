/**
 * POST /api/v1/upload
 * Upload PDF file (compatibility route)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFController } from '@/controllers/pdf.controller';

const controller = new PDFController();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return controller.upload(req as any);
}
