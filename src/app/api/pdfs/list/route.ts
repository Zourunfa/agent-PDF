/**
 * GET /api/pdfs/list
 * Get user's PDF list with conversation statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { getPDFList } from '@/lib/pdf/get-pdf-list';
import { formatErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[API] GET /api/pdfs/list');

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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const sortBy = (searchParams.get('sortBy') || 'uploadedAt') as
      | 'uploadedAt'
      | 'conversationCount'
      | 'lastConversationAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    console.log('[API] Query parameters:', { limit, offset, sortBy, sortOrder });

    // Fetch PDF list
    const result = await getPDFList({
      userId: user.id,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    console.log('[API] Successfully fetched', result.pdfs.length, 'PDFs');

    return NextResponse.json({
      success: true,
      data: {
        total: result.total,
        pdfs: result.pdfs,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error:', error);

    if (error instanceof Error && error.message.includes('Limit must be between')) {
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

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
