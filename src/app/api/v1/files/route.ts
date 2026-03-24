/**
 * GET /api/v1/files
 * List all PDF files
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFController } from '@/controllers/pdf.controller';

const controller = new PDFController();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return controller.getAllFiles(req as any);
}
