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

    // Check if already parsed (also check storage for serverless)
    let existing = parsedPDFs.get(pdfId);
    if (!existing) {
      try {
        const { getPDFFile } = await import("@/lib/storage/pdf-files");
        const pdfFile = await getPDFFile(pdfId);
        if (pdfFile && pdfFile.parseStatus === ParseStatus.COMPLETED && pdfFile.textContent) {
          existing = {
            textContent: pdfFile.textContent,
            pageCount: pdfFile.pageCount || 0,
            parseStatus: pdfFile.parseStatus,
            progress: 100,
          };
          console.log(`[Parse API] ✓ Found completed PDF in storage`);
        }
      } catch (e) {
        // Ignore storage errors
      }
    }

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

    // Parse PDF synchronously (required for Vercel serverless)
    console.log(`[Parse API] → Starting synchronous parse...`);
    const parseResult = await parsePDFAsyncInternal(pdfId);

    console.log(`[Parse API] ✓ Parse completed, returning response`);
    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        parseStatus: parseResult.parseStatus,
        textContent: parseResult.textContent,
        pageCount: parseResult.pageCount,
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

async function parsePDFAsyncInternal(pdfId: string): Promise<{
  parseStatus: ParseStatus;
  textContent: string;
  pageCount: number;
}> {
  try {
    const overallStartTime = Date.now();
    console.log(`[Parse API] ⏱️ Overall timer started at ${new Date().toISOString()}`);
    
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
    const fileCheckStart = Date.now();
    try {
      await fs.access(filePath);
      console.log(`[Parse API] ✓ File exists (${Date.now() - fileCheckStart}ms)`);
    } catch {
      console.error(`[Parse API] ✗ PDF file not found: ${filePath}`);
      return {
        parseStatus: ParseStatus.FAILED,
        textContent: "",
        pageCount: 0,
      };
    }

    // Parse PDF
    const readStart = Date.now();
    console.log(`[Parse API] → Reading file buffer...`);
    
    // Add timeout for file read (2 seconds)
    const readPromise = fs.readFile(filePath);
    const readTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('File read timeout')), 2000)
    );
    
    const buffer = await Promise.race([readPromise, readTimeout]) as Buffer;
    const readTime = Date.now() - readStart;
    console.log(`[Parse API] ✓ PDF file size: ${buffer.length} bytes (read in ${readTime}ms)`);
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
    console.log(`[Parse API] ⏱️ Breakdown: File read ${readTime}ms + Parse ${parseTime}ms = ${readTime + parseTime}ms total`);
    
    const { text, pages } = parseResult;
    console.log(`[Parse API] ✓ Extracted ${text.length} characters from ${pages} pages`);

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
    const chunkStart = Date.now();
    console.log(`[Parse API] Splitting text into chunks...`);
    const chunks = await splitTextWithMetadata(
      text,
      { pdfId, source: "pdf", pageCount: pages }
    );
    const chunkTime = Date.now() - chunkStart;
    console.log(`[Parse API] ✓ Created ${chunks.length} chunks (${chunkTime}ms)`);
    console.log(`[Parse API] First chunk preview: ${chunks[0]?.content.substring(0, 100)}...`);

    const vectorStart = Date.now();
    console.log(`[Parse API] Creating vector store...`);
    console.log(`[Parse API] API Key configured: ${!!process.env.ALIBABA_API_KEY || !!process.env.QWEN_API_KEY}`);

    try {
      // Lazy load vector store functions
      const { createVectorStoreFromChunks, getVectorStoreIds } = await import("@/lib/langchain/vector-store");
      await createVectorStoreFromChunks(pdfId, chunks);
      const vectorTime = Date.now() - vectorStart;
      console.log(`[Parse API] ✓ Vector store created successfully (${vectorTime}ms)`);
      console.log(`[Parse API] Current vector stores: ${getVectorStoreIds().join(', ')}`);
    } catch (vectorError) {
      const vectorTime = Date.now() - vectorStart;
      console.error(`[Parse API] ✗ Vector store creation failed after ${vectorTime}ms:`, vectorError);
      // Continue anyway - text is parsed, just vector search won't work
    }

    const totalTime = Date.now() - overallStartTime;
    console.log(`[Parse API] ✓ PDF parsed successfully: ${pdfId}, ${pages} pages, ${chunks.length} chunks`);
    console.log(`[Parse API] ⏱️ TOTAL TIME BREAKDOWN:`);
    console.log(`[Parse API]   - File read: ${readTime}ms`);
    console.log(`[Parse API]   - PDF parse: ${parseTime}ms`);
    console.log(`[Parse API]   - Text chunking: ${chunkTime}ms`);
    console.log(`[Parse API]   - Vector store: ${Date.now() - vectorStart}ms`);
    console.log(`[Parse API]   - TOTAL: ${totalTime}ms`);
    console.log(`[Parse API] ============================================================`);

    // Return result
    return {
      parseStatus: ParseStatus.COMPLETED,
      textContent: text,
      pageCount: pages,
    };
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

  // First check in-memory parsed PDFs
  let parsed = parsedPDFs.get(pdfId);

  // If not in memory, try to load from PDF storage (for Vercel serverless)
  if (!parsed) {
    try {
      const { getPDFFile } = await import("@/lib/storage/pdf-files");
      const pdfFile = await getPDFFile(pdfId);
      if (pdfFile) {
        parsed = {
          textContent: pdfFile.textContent || "",
          pageCount: pdfFile.pageCount || 0,
          parseStatus: pdfFile.parseStatus,
          progress: pdfFile.parseStatus === ParseStatus.COMPLETED ? 100 : 0,
        };
        console.log(`[Parse API] ✓ Loaded PDF ${pdfId} from storage`);
      }
    } catch (error) {
      console.error(`[Parse API] ✗ Failed to load PDF ${pdfId} from storage:`, error);
    }
  }

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
