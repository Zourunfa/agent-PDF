/**
 * PDF parsing utilities using pdf-parse (more reliable than pdf2json)
 */

export interface ParsedPDF {
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

/**
 * Parse PDF using pdf-parse (more stable and reliable)
 * Falls back to OCR for scanned documents
 */
export async function parsePDF(buffer: Buffer, useOCR: boolean = false): Promise<ParsedPDF> {
  // If OCR is explicitly requested, use it directly
  if (useOCR) {
    console.log("[Parser] OCR mode requested, using OCR parser...");
    const { parseScannedPDF } = await import("./ocr-parser");
    return parseScannedPDF(buffer);
  }

  try {
    console.log("[Parser] Parsing PDF with pdf-parse...");
    console.log("[Parser] Buffer size:", buffer.length, "bytes");

    // Dynamic import to avoid webpack issues
    const pdfParse = (await import("pdf-parse")).default;
    console.log("[Parser] ✓ pdf-parse imported successfully");

    console.log("[Parser] → Calling pdfParse(buffer)...");
    const data = await pdfParse(buffer);
    console.log("[Parser] ✓ PDF parsed successfully");

    const text = data.text.trim();
    const pages = data.numpages;

    console.log(`[Parser] ✓ Extracted ${text.length} characters from ${pages} pages`);

    // Check if PDF is image-based (scanned)
    if (text.length < 50) {
      console.warn(`[Parser] ⚠️  PDF appears to be scanned/image-based (only ${text.length} chars), attempting OCR...`);
      
      try {
        const { parseScannedPDF, isOCRAvailable } = await import("./ocr-parser");
        
        if (!isOCRAvailable()) {
          throw new Error(
            "此 PDF 文件是扫描件，需要 OCR 处理，但 OCR 功能未安装。\n\n" +
            "请运行: npm install tesseract.js pdf-to-png-converter"
          );
        }
        
        console.log("[Parser] → Switching to OCR mode...");
        const ocrResult = await parseScannedPDF(buffer);
        return ocrResult;
      } catch (ocrError) {
        console.error("[Parser] OCR fallback failed:", ocrError);
        throw new Error(
          `此 PDF 文件是扫描件，OCR 识别失败。\n\n` +
          `错误: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}\n\n` +
          `建议：\n` +
          `1. 确保 PDF 图片清晰可读\n` +
          `2. 尝试使用专业 OCR 工具预处理\n` +
          `3. 上传文本型 PDF（可选择文字的 PDF）`
        );
      }
    }

    return {
      text,
      pages,
      info: data.info || {},
    };
  } catch (error) {
    console.error("[Parser] Error:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { text } = await parsePDF(buffer);
  return text;
}

/**
 * Check if text content is valid
 */
export function isValidPDFText(text: string): boolean {
  return text.trim().length > 50;
}
