/**
 * PDF File API Route - 提供PDF文件内容用于预览
 */

import { NextRequest, NextResponse } from "next/server";
import { getPDFFile } from "@/lib/storage/pdf-files";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pdf = getPDFFile(params.id);

    if (!pdf || !pdf.tempPath) {
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

    // 读取PDF文件
    const filePath = join(process.cwd(), pdf.tempPath);
    const fileBuffer = await readFile(filePath);

    // 返回PDF文件内容
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(pdf.fileName)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF file fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "读取PDF文件失败",
        },
      },
      { status: 500 }
    );
  }
}
