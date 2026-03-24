/**
 * GET /api/v1/pdfs/[id]/conversations
 * Get conversation history for a specific PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatController } from '@/controllers/chat.controller';

const controller = new ChatController();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return controller.getConversationHistory(req as any, { params });
}
