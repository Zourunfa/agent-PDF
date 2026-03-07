/**
 * PDF File API Route - 提供PDF文件内容用于预览
 */

import { NextRequest, NextResponse } from "next/server";
import { getPDFFile } from "@/lib/storage/pdf-files";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PDF API] Fetching PDF for ID:', params.id);

    const pdf = getPDFFile(params.id);

    if (!pdf) {
      console.error('[PDF API] PDF not found in storage:', params.id);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "找不到指定的 PDF 文件",
          },
        },
        { status: 404 }
      );
    }

    console.log('[PDF API] PDF found:', pdf.fileName);
    console.log('[PDF API] Temp path:', pdf.tempPath);

    if (!pdf.tempPath) {
      console.error('[PDF API] PDF has no temp path');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "PDF 文件路径不存在",
          },
        },
        { status: 404 }
      );
    }

    // 检查文件是否存在
    if (!existsSync(pdf.tempPath)) {
      console.error('[PDF API] PDF file does not exist at path:', pdf.tempPath);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "PDF 文件不存在",
          },
        },
        { status: 404 }
      );
    }

    console.log('[PDF API] File exists, reading...');

    // 读取PDF文件
    const fileBuffer = await readFile(pdf.tempPath);

    console.log('[PDF API] File read successfully, size:', fileBuffer.length);

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
    console.error("[PDF API] Error fetching PDF:", error);
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
