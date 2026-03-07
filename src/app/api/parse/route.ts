/**
 * PDF Parse API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { parsePDF, isValidPDFText } from "@/lib/pdf/parser";
import { splitTextWithMetadata } from "@/lib/pdf/text-splitter";
import { createVectorStoreFromChunks } from "@/lib/langchain/vector-store";
import { ParseStatus } from "@/types/pdf";
import { formatErrorResponse } from "@/lib/utils/errors";

// Store parsed PDFs in memory (in production, use a database)
const parsedPDFs = new Map<string, {
  textContent: string;
  pageCount: number;
  parseStatus: ParseStatus;
  progress: number;
}>();

export async function POST(req: NextRequest) {
  try {
    const { pdfId } = await req.json();

    if (!pdfId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "缺少 PDF ID",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Check if already parsed
    const existing = parsedPDFs.get(pdfId);
    if (existing && existing.parseStatus === ParseStatus.COMPLETED) {
      return NextResponse.json({
        success: true,
        data: {
          pdfId,
          parseStatus: ParseStatus.COMPLETED,
          textContent: existing.textContent,
          pageCount: existing.pageCount,
          chunkCount: Math.ceil(existing.textContent.length / 1000),
        },
      });
    }

    // Set status to parsing
    parsedPDFs.set(pdfId, {
      textContent: "",
      pageCount: 0,
      parseStatus: ParseStatus.PARSING,
      progress: 0,
    });

    // Parse PDF asynchronously (in production, use a job queue)
    parsePDFAsync(pdfId);

    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        parseStatus: ParseStatus.PARSING,
        estimatedTime: 3,
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}

async function parsePDFAsync(pdfId: string) {
  try {
    // TODO: Read file from temp storage and parse
    // For now, simulate parsing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate parsed content
    const textContent = "This is sample PDF content that has been extracted.";
    const pageCount = 1;

    // Update status
    parsedPDFs.set(pdfId, {
      textContent,
      pageCount,
      parseStatus: ParseStatus.COMPLETED,
      progress: 100,
    });

    // Split into chunks and create vector store
    const chunks = await splitTextWithMetadata(
      textContent,
      { pdfId, source: "pdf" }
    );

    await createVectorStoreFromChunks(pdfId, chunks);
  } catch (error) {
    console.error("Async parse error:", error);
    parsedPDFs.set(pdfId, {
      textContent: "",
      pageCount: 0,
      parseStatus: ParseStatus.FAILED,
      progress: 0,
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pdfId = searchParams.get("pdfId");

  if (!pdfId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "缺少 PDF ID",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const parsed = parsedPDFs.get(pdfId);

  if (!parsed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "找不到 PDF 解析记录",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      pdfId,
      parseStatus: parsed.parseStatus,
      progress: parsed.progress,
      textContent: parsed.textContent || undefined,
      pageCount: parsed.pageCount || undefined,
      completedAt: parsed.parseStatus === ParseStatus.COMPLETED
        ? new Date().toISOString()
        : undefined,
    },
  });
}
