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

    // 列出所有存储的PDF（调试用）
    const allPDFs = getAllPDFFiles();
    console.log('[PDF API] All PDFs in storage:', allPDFs.map(p => ({ id: p.id, name: p.fileName, hasPath: !!p.tempPath })));

    const pdf = await getPDFFile(pdfId);

    if (!pdf) {
      console.error('[PDF API] ❌ PDF not found in storage:', pdfId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `找不到指定的 PDF 文件 (ID: ${pdfId})`,
            debug: {
              pdfId,
              availablePDFs: allPDFs.map(p => p.id),
            },
          },
        },
        { status: 404 }
      );
    }

    console.log('[PDF API] ✓ PDF found:', pdf.fileName);
    console.log('[PDF API] Temp path:', pdf.tempPath);

    if (!pdf.tempPath) {
      console.error('[PDF API] ❌ PDF has no temp path');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "PDF 文件路径不存在",
            debug: {
              pdfId,
              pdf: {
                id: pdf.id,
                fileName: pdf.fileName,
                hasTempPath: !!pdf.tempPath,
              },
            },
          },
        },
        { status: 404 }
      );
    }

    // 检查文件是否存在
    if (!existsSync(pdf.tempPath)) {
      console.error('[PDF API] ❌ PDF file does not exist at path:', pdf.tempPath);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "PDF 文件不存在于磁盘",
            debug: {
              pdfId,
              tempPath: pdf.tempPath,
            },
          },
        },
        { status: 404 }
      );
    }

    console.log('[PDF API] ✓ File exists, reading...');

    // 读取PDF文件
    const fileBuffer = await readFile(pdf.tempPath);

    console.log('[PDF API] ✓ File read successfully, size:', fileBuffer.length, 'bytes');
    console.log('[PDF API] ============================================');

    // 返回PDF文件内容
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(pdf.fileName)}"`,
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("[PDF API] ❌ Error fetching PDF:", error);
    console.error("[PDF API] Error stack:", (error as Error).stack);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "读取PDF文件失败: " + (error as Error).message,
          stack: (error as Error).stack,
        },
      },
      { status: 500 }
    );
  }
}
