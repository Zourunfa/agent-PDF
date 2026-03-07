/**
 * PDF Parse API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { parsePDF, isValidPDFText } from "@/lib/pdf/parser";
import { splitTextWithMetadata } from "@/lib/pdf/text-splitter";
import { ParseStatus } from "@/types/pdf";
import { formatErrorResponse } from "@/lib/utils/errors";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Store parsed PDFs in memory (in production, use a database)
const parsedPDFs = new Map<string, {
  textContent: string;
  pageCount: number;
  parseStatus: ParseStatus;
  progress: number;
}>();

export async function POST(req: NextRequest) {
  // Lazy load vector store to avoid build-time execution
  const { createVectorStoreFromChunks, getVectorStoreIds } = await import("@/lib/langchain/vector-store");
  
  try {
    const body = await req.json();
    const { pdfId } = body;

    console.log(`[Parse API] ========== POST REQUEST RECEIVED ==========`);
    console.log(`[Parse API] Request body:`, body);

    if (!pdfId) {
      console.error(`[Parse API] ✗ No pdfId provided`);
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

    console.log(`[Parse API] ✓ Received parse request for PDF: ${pdfId}`);

    // Check if already parsed
    const existing = parsedPDFs.get(pdfId);
    if (existing && existing.parseStatus === ParseStatus.COMPLETED) {
      console.log(`[Parse API] ✓ PDF ${pdfId} already parsed`);
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
    console.log(`[Parse API] ✓ Status set to PARSING`);

    // Parse PDF asynchronously (in production, use a job queue)
    console.log(`[Parse API] → Starting async parse...`);
    parsePDFAsync(pdfId);

    console.log(`[Parse API] ✓ Parse request accepted, returning response`);
    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        parseStatus: ParseStatus.PARSING,
        estimatedTime: 3,
      },
    });
  } catch (error) {
    console.error("[Parse API] ✗ Parse error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}

async function parsePDFAsync(pdfId: string) {
  console.log(`[Parse API] ============================================================`);
  console.log(`[Parse API] ⚡ async function STARTED for PDF: ${pdfId}`);
  console.log(`[Parse API] Current memory store keys: ${Array.from(parsedPDFs.keys())}`);
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');

    // Get temp file path
    // Use /tmp for serverless environments
    const tempDir = process.env.VERCEL 
      ? path.join('/tmp', 'pdf-chat')
      : path.join(os.tmpdir(), 'pdf-chat');
    const filePath = path.join(tempDir, `${pdfId}.pdf`);

    console.log(`[Parse API] Reading PDF from: ${filePath}`);

    // Check if file exists
    try {
      await fs.access(filePath);
      console.log(`[Parse API] ✓ File exists`);
    } catch {
      console.error(`[Parse API] ✗ PDF file not found: ${filePath}`);
      parsedPDFs.set(pdfId, {
        textContent: "",
        pageCount: 0,
        parseStatus: ParseStatus.FAILED,
        progress: 0,
      });
      return;
    }

    // Parse PDF
    const buffer = await fs.readFile(filePath);
    console.log(`[Parse API] ✓ PDF file size: ${buffer.length} bytes`);

    console.log(`[Parse API] ========== STARTING PDF PARSE ==========`);
    const parseResult = await parsePDF(buffer);
    console.log(`[Parse API] ========== PDF PARSE COMPLETED ==========`);
    console.log(`[Parse API] Parse result:`, {
      textLength: parseResult.text.length,
      pages: parseResult.pages,
      ocrProcessed: parseResult.info.ocrProcessed || false,
    });

    const { text, pages } = parseResult;
    console.log(`[Parse API] ✓ Parsed ${text.length} characters from ${pages} pages`);

    if (!isValidPDFText(text)) {
      console.error(`[Parse API] ✗ Invalid PDF text: length=${text.length}`);
      throw new Error("PDF 解析失败或内容为空");
    }

    // Update status
    parsedPDFs.set(pdfId, {
      textContent: text,
      pageCount: pages,
      parseStatus: ParseStatus.COMPLETED,
      progress: 100,
    });

    // Update PDF file storage with parsed content
    console.log(`[Parse API] Updating PDF file storage with parsed content...`);
    try {
      const { getPDFFile, addPDFFile } = await import("@/lib/storage/pdf-files");
      const pdfFile = await getPDFFile(pdfId);
      if (pdfFile) {
        pdfFile.textContent = text;
        pdfFile.pageCount = pages;
        pdfFile.parseStatus = ParseStatus.COMPLETED;
        await addPDFFile(pdfFile);
        console.log(`[Parse API] ✓ PDF file storage updated and persisted`);
      } else {
        console.error(`[Parse API] ✗ PDF file not found in storage`);
      }
    } catch (storageError) {
      console.error(`[Parse API] ✗ Failed to update PDF file storage:`, storageError);
    }

    // Split into chunks and create vector store
    console.log(`[Parse API] Splitting text into chunks...`);
    const chunks = await splitTextWithMetadata(
      text,
      { pdfId, source: "pdf", pageCount: pages }
    );
    console.log(`[Parse API] ✓ Created ${chunks.length} chunks`);
    console.log(`[Parse API] First chunk preview: ${chunks[0]?.content.substring(0, 100)}...`);

    console.log(`[Parse API] Creating vector store...`);
    console.log(`[Parse API] API Key configured: ${!!process.env.ALIBABA_API_KEY || !!process.env.QWEN_API_KEY}`);

    try {
      // Lazy load vector store functions
      const { createVectorStoreFromChunks, getVectorStoreIds } = await import("@/lib/langchain/vector-store");
      await createVectorStoreFromChunks(pdfId, chunks);
      console.log(`[Parse API] ✓ Vector store created successfully`);
      console.log(`[Parse API] Current vector stores: ${getVectorStoreIds().join(', ')}`);
    } catch (vectorError) {
      console.error(`[Parse API] ✗ Vector store creation failed:`, vectorError);
      // Continue anyway - text is parsed, just vector search won't work
    }

    console.log(`[Parse API] ✓ PDF parsed successfully: ${pdfId}, ${pages} pages, ${chunks.length} chunks`);
    console.log(`[Parse API] ============================================================`);
  } catch (error) {
    console.error("[Parse API] ✗ Async parse error:", error);
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
