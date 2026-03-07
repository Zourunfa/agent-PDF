/**
 * Storage Debug API - Check storage status
 */

import { NextResponse } from "next/server";
import { getAllPDFFiles } from "@/lib/storage/pdf-files";
import { getVectorStoreIds } from "@/lib/langchain/vector-store";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get storage directory
    const storageDir = process.env.VERCEL 
      ? path.join('/tmp', 'pdf-storage')
      : path.join(os.tmpdir(), 'pdf-storage');

    // Check if directory exists
    let dirExists = false;
    let filesInDir: string[] = [];
    try {
      await fs.access(storageDir);
      dirExists = true;
      filesInDir = await fs.readdir(storageDir);
    } catch {
      dirExists = false;
    }

    // Get in-memory data
    const pdfFiles = getAllPDFFiles();
    const vectorStores = getVectorStoreIds();

    return NextResponse.json({
      success: true,
      data: {
        environment: {
          isVercel: !!process.env.VERCEL,
          nodeEnv: process.env.NODE_ENV,
          hasApiKey: !!(process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY),
        },
        storage: {
          directory: storageDir,
          exists: dirExists,
          filesCount: filesInDir.length,
          files: filesInDir,
        },
        memory: {
          pdfFilesCount: pdfFiles.length,
          pdfFiles: pdfFiles.map(pdf => ({
            id: pdf.id,
            fileName: pdf.fileName,
            hasTextContent: !!pdf.textContent,
            textLength: pdf.textContent?.length || 0,
            pageCount: pdf.pageCount,
            parseStatus: pdf.parseStatus,
          })),
          vectorStoresCount: vectorStores.length,
          vectorStores,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Storage Debug] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
