/**
 * PDF File API Route - 提供PDF文件内容用于预览
 * 支持从 Vercel Blob Storage 和数据库获取历史 PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFFile, getAllPDFFiles } from '@/lib/storage/pdf-files';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/middleware';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pdfId = params.id;

    console.log('[PDF API] ============================================');
    console.log('[PDF API] Fetching PDF for ID:', pdfId);

    // 首先尝试从内存缓存获取（新上传的文件）
    const cachedPdf = await getPDFFile(pdfId);

    if (cachedPdf && cachedPdf.tempPath && existsSync(cachedPdf.tempPath)) {
      console.log('[PDF API] ✓ Found in cache with temp path:', cachedPdf.tempPath);
      const fileBuffer = await readFile(cachedPdf.tempPath);
      console.log('[PDF API] ✓ File read successfully, size:', fileBuffer.length, 'bytes');

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': `inline; filename="${encodeURIComponent(cachedPdf.fileName)}"`,
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes',
        },
      });
    }

    // 如果缓存中没有，从数据库获取（历史文件）
    console.log('[PDF API] 📝 PDF not in cache, checking database...');
    const supabase = createClient();
    const user = await getCurrentUser();

    // 从数据库获取 PDF 信息
    const { data: pdfData, error: pdfError } = await supabase
      .from('user_pdfs')
      .select('id, filename, storage_path, user_id')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdfData) {
      console.error('[PDF API] ❌ PDF not found in database:', pdfError);

      // List available PDFs for debugging
      const allPDFs = await getAllPDFFiles();
      console.log(
        '[PDF API] Available cached PDFs:',
        allPDFs.map((p) => p.id)
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `找不到指定的 PDF 文件 (ID: ${pdfId})`,
          },
        },
        { status: 404 }
      );
    }

    // 检查权限
    if (user && (pdfData as any).user_id !== user.id) {
      console.error('[PDF API] ❌ Access denied: User does not own this PDF');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '无权访问此 PDF 文件',
          },
        },
        { status: 403 }
      );
    }

    const storagePath = (pdfData as any).storage_path;
    const filename = (pdfData as any).filename;

    console.log('[PDF API] ✓ Found in database:', { storagePath, filename });

    // 如果是 Blob URL，返回重定向或代理请求
    if (storagePath && storagePath.startsWith('http')) {
      console.log('[PDF API] ☁️ Found Blob URL, redirecting...');
      return NextResponse.redirect(storagePath);
    }

    // 如果是临时路径，尝试读取
    if (storagePath && existsSync(storagePath)) {
      console.log('[PDF API] ✓ Reading from temp path...');
      const fileBuffer = await readFile(storagePath);
      console.log('[PDF API] ✓ File read successfully, size:', fileBuffer.length, 'bytes');

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes',
        },
      });
    }

    // 文件不可访问
    console.error('[PDF API] ❌ PDF file not accessible at:', storagePath);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FILE_NOT_ACCESSIBLE',
          message: 'PDF 文件暂时不可访问',
          debug: {
            pdfId,
            storagePath,
            reason: '文件可能已被清理或存储位置不可访问',
          },
        },
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[PDF API] ❌ Error fetching PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '读取PDF文件失败: ' + (error as Error).message,
        },
      },
      { status: 500 }
    );
  }
}
