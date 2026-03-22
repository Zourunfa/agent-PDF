/**
 * Local File Uploads API Route
 * Serves PDF files from local filesystem storage (Docker/self-hosted)
 * This route handles requests to /uploads/* paths
 */

import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { getFileStorage } from '@/lib/storage/adapters/file-storage-adapter';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    console.log('[Uploads API] Serving file:', filePath);

    // Extract PDF ID from path (assuming format: uploads/{id}.pdf)
    const pdfId = filePath.replace('.pdf', '').replace(/^(uploads\/)?/, '');

    if (!pdfId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PATH',
            message: 'Invalid file path',
          },
        },
        { status: 400 }
      );
    }

    // Get the storage adapter
    const storage = getFileStorage();

    // Check if file exists
    const exists = await storage.exists(pdfId);
    if (!exists) {
      console.error('[Uploads API] File not found:', pdfId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `File not found: ${pdfId}`,
          },
        },
        { status: 404 }
      );
    }

    // Download the file
    const buffer = await storage.download(pdfId);

    console.log('[Uploads API] ✓ Served file:', pdfId, buffer.length, 'bytes');

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(pdfId)}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Uploads API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to serve file: ' + (error as Error).message,
        },
      },
      { status: 500 }
    );
  }
}
