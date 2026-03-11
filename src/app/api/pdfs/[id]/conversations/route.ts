/**
 * GET /api/pdfs/[id]/conversations
 * Get conversation history for a specific PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { getConversationHistory } from '@/lib/chat/get-conversation-history';
import { userOwnsPDF } from '@/lib/pdf/get-pdf-list';
import { formatErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pdfId = params.id;

  console.log('[API] GET /api/pdfs/[id]/conversations:', pdfId);

  try {
    // Verify user is authenticated
    const user = await getCurrentUser();

    if (!user || !user.id) {
      console.log('[API] Unauthorized access attempt');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    console.log('[API] User authenticated:', user.id);

    // Verify user owns the PDF
    const owns = await userOwnsPDF(pdfId, user.id);

    if (!owns) {
      console.log('[API] User does not own PDF:', pdfId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this PDF',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    console.log('[API] PDF ownership verified');

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    console.log('[API] Query parameters:', { limit, offset });

    // Fetch conversation history
    const result = await getConversationHistory({
      pdfId,
      userId: user.id,
      limit,
      offset,
    });

    console.log('[API] Successfully fetched', result.messages.length, 'messages');

    return NextResponse.json({
      success: true,
      data: {
        pdfId: result.pdfId,
        filename: result.filename,
        pageCount: result.pageCount,
        messages: result.messages,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('PDF not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'PDF not found',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Limit must be between')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
