/**
 * DELETE /api/pdfs/[id]
 * Delete a PDF and all its associated data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { deletePDF } from '@/lib/pdf/delete-pdf';
import { userOwnsPDF } from '@/lib/pdf/get-pdf-list';
import { formatErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pdfId = params.id;

  console.log('[API] DELETE /api/pdfs/[id]:', pdfId);

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

    // Delete PDF and all associated data
    const result = await deletePDF(pdfId, user.id);

    console.log('[API] PDF deleted successfully:', result);

    return NextResponse.json({
      success: true,
      data: {
        pdfId: result.pdfId,
        messagesDeleted: result.messagesDeleted,
        conversationsDeleted: result.conversationsDeleted,
      },
      message: 'PDF and all associated data deleted successfully',
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

      if (error.message.includes('access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
