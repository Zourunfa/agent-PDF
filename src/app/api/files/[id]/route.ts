/**
 * File Details API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { getPDFFile, removePDFFile } from "@/lib/storage/pdf-files";
import { formatErrorResponse } from "@/lib/utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pdf = await getPDFFile(params.id);

    if (!pdf) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "找不到指定的 PDF 文件",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...pdf,
        hasConversation: false,
        conversationId: null,
      },
    });
  } catch (error) {
    console.error("File details error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existed = removePDFFile(params.id);

    if (!existed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "找不到指定的 PDF 文件",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pdfId: params.id,
        deleted: true,
      },
    });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
