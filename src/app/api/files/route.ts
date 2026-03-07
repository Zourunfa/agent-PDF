/**
 * Files API Route - List and manage PDF files
 */

import { NextRequest, NextResponse } from "next/server";
import { formatErrorResponse } from "@/lib/utils/errors";
import { getAllPDFFiles } from "@/lib/storage/pdf-files";

export async function GET(req: NextRequest) {
  try {
    const pdfs = getAllPDFFiles();

    return NextResponse.json({
      success: true,
      data: {
        pdfs,
        count: pdfs.length,
      },
    });
  } catch (error) {
    console.error("Files list error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
