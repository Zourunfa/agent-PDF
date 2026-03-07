/**
 * PDF Upload API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validatePDFFile } from "@/lib/utils/validation";
import { saveTempFile, generateTempFileName } from "@/lib/storage/temp-files";
import { addPDFFile, getPDFFile } from "@/lib/storage/pdf-files";
import { ParseStatus } from "@/types/pdf";
import { formatErrorResponse } from "@/lib/utils/errors";
import { parsePDF } from "@/lib/pdf/parser";
import { splitTextWithMetadata } from "@/lib/pdf/text-splitter";
import { createVectorStoreFromChunks } from "@/lib/langchain/vector-store";

/**
 * Parse PDF in background after upload
 */
async function parsePDFInBackground(pdfId: string) {
  try {
    console.log(`[Background Parse] Starting parse for ${pdfId}`);

    const pdfFile = await getPDFFile(pdfId);
    if (!pdfFile) {
      console.error(`[Background Parse] PDF ${pdfId} not found`);
      return;
    }

    // Update status to parsing
    pdfFile.parseStatus = ParseStatus.PARSING;
    await addPDFFile(pdfFile);

    // Read PDF file and extract text
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(pdfFile.tempPath);
    console.log(`[Background Parse] PDF file read: ${buffer.length} bytes`);

    // Parse PDF
    const { text, pages } = await parsePDF(buffer);
    console.log(`[Background Parse] Extracted ${text.length} chars from ${pages} pages`);

    // Update PDF file with parsed content
    pdfFile.textContent = text;
    pdfFile.pageCount = pages;
    pdfFile.parseStatus = ParseStatus.COMPLETED;
    await addPDFFile(pdfFile);
    console.log(`[Background Parse] ✓ PDF ${pdfId} parsing completed`);

    // Create vector store for chat
    const chunks = await splitTextWithMetadata(
      text,
      { pdfId, source: "pdf", pageCount: pages }
    );
    console.log(`[Background Parse] Created ${chunks.length} chunks`);

    await createVectorStoreFromChunks(pdfId, chunks);
    console.log(`[Background Parse] ✓ Vector store created for ${pdfId}`);

  } catch (error) {
    console.error(`[Background Parse] ✗ Failed to parse ${pdfId}:`, error);

    // Mark as failed
    try {
      const pdfFile = await getPDFFile(pdfId);
      if (pdfFile) {
        pdfFile.parseStatus = ParseStatus.FAILED;
        await addPDFFile(pdfFile);
      }
    } catch (updateError) {
      console.error(`[Background Parse] ✗ Failed to update status:`, updateError);
    }
  }
}

export async function POST(req: NextRequest) {
  console.log('📬 收到上传请求');

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    console.log('📋 解析的文件信息:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      hasFile: !!file,
    });

    if (!file) {
      console.error('❌ 未找到文件');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "未找到文件",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validatePDFFile(file);
    console.log('🔍 文件验证结果:', validation);

    if (!validation.valid) {
      console.error('❌ 文件验证失败:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Generate IDs and filename
    const pdfId = randomUUID();
    const taskId = randomUUID();
    const sanitizedName = validation.sanitizedName || file.name;
    const tempFileName = generateTempFileName(pdfId); // Use pdfId as filename

    console.log('🆔 生成ID:', { pdfId, taskId, tempFileName });

    // Save file to temp directory
    console.log('💾 开始保存文件到临时目录...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempPath = await saveTempFile(buffer, tempFileName);

    console.log('✅ 文件已保存到:', tempPath);

    // Create PDF file record
    const pdfFile = {
      id: pdfId,
      fileName: file.name,
      sanitizedName,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      parseStatus: ParseStatus.PENDING,
      textContent: null,
      pageCount: null,
      tempPath,
    };

    console.log('📝 创建PDF记录:', {
      id: pdfFile.id,
      fileName: pdfFile.fileName,
      fileSize: pdfFile.fileSize,
    });

    // Store PDF file in memory storage
    await addPDFFile(pdfFile);

    console.log('✅ 上传完成，准备返回响应');

    // Trigger PDF parsing in background (non-blocking)
    // In Vercel serverless, we need to parse immediately since we can't spawn background tasks
    console.log('🔄 Triggering PDF parsing...');
    parsePDFInBackground(pdfId).catch(error => {
      console.error(`❌ Background parsing failed for ${pdfId}:`, error);
    });

    // Convert buffer to base64 for frontend caching (Vercel Serverless workaround)
    const base64Data = buffer.toString('base64');
    console.log('📦 Base64 data size:', base64Data.length, 'chars');

    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        parseStatus: ParseStatus.PENDING,
        uploadTaskId: taskId,
        tempPath, // 返回文件路径
        base64Data, // 返回 base64 数据用于前端预览
      },
    });
  } catch (error) {
    console.error("💥 Upload error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
