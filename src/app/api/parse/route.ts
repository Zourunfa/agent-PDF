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
  
  // Set a hard timeout for the entire parsing process (8 seconds for Vercel)
  const PARSE_TIMEOUT = 8000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`[Parse API] ✗ Hard timeout after ${PARSE_TIMEOUT}ms`);
      reject(new Error('PDF 解析超时 - Vercel 函数执行时间限制'));
    }, PARSE_TIMEOUT);
  });
  
  try {
    await Promise.race([
      parsePDFAsyncInternal(pdfId),
      timeoutPromise
    ]);
  } catch (error) {
    console.error("[Parse API] ✗ Parse failed with timeout or error:", error);
    
    // Mark as failed
    parsedPDFs.set(pdfId, {
      textContent: "",
      pageCount: 0,
      parseStatus: ParseStatus.FAILED,
      progress: 0,
    });
    
    // Update storage
    try {
      const { getPDFFile, addPDFFile } = await import("@/lib/storage/pdf-files");
      const pdfFile = await getPDFFile(pdfId);
      if (pdfFile) {
        pdfFile.parseStatus = ParseStatus.FAILED;
        await addPDFFile(pdfFile);
      }
    } catch (storageError) {
      console.error("[Parse API] ✗ Failed to update storage:", storageError);
    }
  }
}

async function parsePDFAsyncInternal(pdfId: string) {
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
    console.log(`[Parse API] → Reading file buffer...`);
    const buffer = await fs.readFile(filePath);
    console.log(`[Parse API] ✓ PDF file size: ${buffer.length} bytes`);
    console.log(`[Parse API] ✓ Buffer is valid: ${Buffer.isBuffer(buffer)}`);

    console.log(`[Parse API] ========== STARTING PDF PARSE ==========`);
    const parseStartTime = Date.now();
    
    // Wrap parsePDF in its own timeout to catch hanging (7 seconds)
    const parseWithTimeout = Promise.race([
      parsePDF(buffer),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF 解析超时 - pdf2json 未响应')), 7000)
      )
    ]);
    
    const parseResult = await parseWithTimeout;
    const parseTime = Date.now() - parseStartTime;
    console.log(`[Parse API] ========== PDF PARSE COMPLETED in ${parseTime}ms ==========`);
    
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
    if (error instanceof Error) {
      console.error("[Parse API] ✗ Error message:", error.message);
      console.error("[Parse API] ✗ Error stack:", error.stack);
    }
    throw error; // Re-throw to be caught by outer timeout handler
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
