/**
 * Manual Text Input API
 * Handles manually pasted PDF text and creates vector store
 */

import { NextRequest, NextResponse } from "next/server";
import { splitTextWithMetadata } from "@/lib/pdf/text-splitter";
import { formatErrorResponse } from "@/lib/utils/errors";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfId, text } = body;

    console.log(`[Manual Text API] Received manual text for PDF: ${pdfId}`);
    console.log(`[Manual Text API] Text length: ${text?.length || 0} characters`);

    if (!pdfId || !text) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "缺少 PDF ID 或文本内容",
          },
        },
        { status: 400 }
      );
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TEXT",
            message: "文本内容太短，至少需要 50 个字符",
          },
        },
        { status: 400 }
      );
    }

    // Update PDF file storage
    console.log(`[Manual Text API] Updating PDF file storage...`);
    try {
      const { getPDFFile, addPDFFile } = await import("@/lib/storage/pdf-files");
      const { ParseStatus } = await import("@/types/pdf");
      
      const pdfFile = await getPDFFile(pdfId);
      if (pdfFile) {
        pdfFile.textContent = text.trim();
        pdfFile.pageCount = 1; // Manual input treated as 1 page
        pdfFile.parseStatus = ParseStatus.COMPLETED;
        await addPDFFile(pdfFile);
        console.log(`[Manual Text API] ✓ PDF file storage updated`);
      }
    } catch (storageError) {
      console.error(`[Manual Text API] ✗ Storage update failed:`, storageError);
    }

    // Split into chunks and create vector store
    console.log(`[Manual Text API] Splitting text into chunks...`);
    const chunks = await splitTextWithMetadata(
      text.trim(),
      { pdfId, source: "manual", pageCount: 1 }
    );
    console.log(`[Manual Text API] ✓ Created ${chunks.length} chunks`);

    console.log(`[Manual Text API] Creating vector store...`);
    try {
      const { createVectorStoreFromChunks } = await import("@/lib/langchain/vector-store");
      await createVectorStoreFromChunks(pdfId, chunks);
      console.log(`[Manual Text API] ✓ Vector store created successfully`);
    } catch (vectorError) {
      console.error(`[Manual Text API] ✗ Vector store creation failed:`, vectorError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VECTOR_STORE_ERROR",
            message: "向量存储创建失败",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        chunkCount: chunks.length,
        textLength: text.trim().length,
      },
    });
  } catch (error) {
    console.error("[Manual Text API] ✗ Error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
