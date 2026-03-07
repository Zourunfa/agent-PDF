/**
 * PDF Upload API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validatePDFFile } from "@/lib/utils/validation";
import { saveTempFile, generateTempFileName } from "@/lib/storage/temp-files";
import { addPDFFile } from "@/lib/storage/pdf-files";
import { ParseStatus } from "@/types/pdf";
import { formatErrorResponse } from "@/lib/utils/errors";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
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
    if (!validation.valid) {
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
    const tempFileName = generateTempFileName(sanitizedName);

    // Save file to temp directory
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempPath = await saveTempFile(buffer, tempFileName);

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

    // Store PDF file in memory storage
    addPDFFile(pdfFile);

    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        parseStatus: ParseStatus.PENDING,
        uploadTaskId: taskId,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
