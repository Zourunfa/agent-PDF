/**
 * PDF File API Route - 提供PDF文件内容用于预览
 */

import { NextRequest, NextResponse } from "next/server";
import { getPDFFile, getAllPDFFiles } from "@/lib/storage/pdf-files";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pdfId = params.id;

    console.log('[PDF API] ============================================');
    console.log('[PDF API] Fetching PDF for ID:', pdfId);

    // Try to get PDF from storage
    const pdf = await getPDFFile(pdfId);

    if (!pdf) {
      console.error('[PDF API] ❌ PDF not found in storage:', pdfId);
      
      // List available PDFs for debugging
      const allPDFs = await getAllPDFFiles();
      console.log('[PDF API] Available PDFs:', allPDFs.map(p => p.id));
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `找不到指定的 PDF 文件 (ID: ${pdfId})`,
            debug: {
              pdfId,
              availablePDFs: allPDFs.map(p => p.id),
              hint: "PDF 可能在不同的 Serverless 实例中，请使用 Vercel Blob Storage",
            },
          },
        },
        { status: 404 }
      );
    }

    console.log('[PDF API] ✓ PDF found:', pdf.fileName);
    console.log('[PDF API] Temp path:', pdf.tempPath);

    // Check if file exists at temp path
    if (pdf.tempPath && existsSync(pdf.tempPath)) {
      console.log('[PDF API] ✓ File exists at temp path, reading...');
      const fileBuffer = await readFile(pdf.tempPath);
      console.log('[PDF API] ✓ File read successfully, size:', fileBuffer.length, 'bytes');
      console.log('[PDF API] ============================================');

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": fileBuffer.length.toString(),
          "Content-Disposition": `inline; filename="${encodeURIComponent(pdf.fileName)}"`,
          "Cache-Control": "public, max-age=3600",
          "Accept-Ranges": "bytes",
        },
      });
    }

    // If temp file doesn't exist, return error with suggestion
    console.error('[PDF API] ❌ PDF file not found at temp path:', pdf.tempPath);
    console.log('[PDF API] ℹ️ This is expected in Vercel Serverless - files in /tmp are not shared between instances');
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FILE_NOT_ACCESSIBLE",
          message: "PDF 文件暂时不可访问",
          debug: {
            pdfId,
            tempPath: pdf.tempPath,
            reason: "Serverless 环境限制 - /tmp 目录不在函数实例间共享",
            solution: "请刷新页面重新上传 PDF，或使用外部存储（Vercel Blob）",
          },
        },
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("[PDF API] ❌ Error fetching PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "读取PDF文件失败: " + (error as Error).message,
        },
      },
      { status: 500 }
    );
  }
}
