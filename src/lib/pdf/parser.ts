/**
 * PDF parsing utilities using pdf2json with OCR fallback
 */

export interface ParsedPDF {
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

/**
 * Parse PDF using pdf2json (Node.js native, no webpack issues)
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
    console.log("[Parser] Parsing PDF with pdf2json...");

    // Dynamic import to avoid webpack issues
    const PDFParser = (await import("pdf2json")).default;

    return new Promise(async (resolve, reject) => {
      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("[Parser] PDF parse error:", errData);
        reject(new Error(`PDF parse error: ${errData.parserError || errData}`));
      });

      pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
        try {
          let fullText = "";
          let pageCount = 0;
          let totalTextElements = 0;

          if (pdfData.Pages) {
            pageCount = pdfData.Pages.length;
            
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                totalTextElements += page.Texts.length;
                for (const text of page.Texts) {
                  if (text.R) {
                    for (const r of text.R) {
                      if (r.T) {
                        fullText += decodeURIComponent(r.T) + " ";
                      }
                    }
                  }
                }
              }
              fullText += "\n\n";
            }
          }

          const cleanText = fullText.trim();
          console.log(`[Parser] ✓ PDF parsed: ${pageCount} pages, ${totalTextElements} text elements`);
          console.log(`[Parser] ✓ Extracted ${cleanText.length} characters`);

          // Check if PDF is image-based (scanned)
          if (totalTextElements === 0 || cleanText.length < 50) {
            console.warn(`[Parser] ⚠️  PDF appears to be scanned/image-based, attempting OCR...`);
            
            try {
              const { parseScannedPDF, isOCRAvailable } = await import("./ocr-parser");
              
              if (!isOCRAvailable()) {
                reject(new Error(
                  "此 PDF 文件是扫描件，需要 OCR 处理，但 OCR 功能未安装。\n\n" +
                  "请运行: npm install tesseract.js pdf-to-png-converter"
                ));
                return;
              }
              
              console.log("[Parser] → Switching to OCR mode...");
              const ocrResult = await parseScannedPDF(buffer);
              resolve(ocrResult);
            } catch (ocrError) {
              console.error("[Parser] OCR fallback failed:", ocrError);
              reject(new Error(
                `此 PDF 文件是扫描件，OCR 识别失败。\n\n` +
                `错误: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}\n\n` +
                `建议：\n` +
                `1. 确保 PDF 图片清晰可读\n` +
                `2. 尝试使用专业 OCR 工具预处理\n` +
                `3. 上传文本型 PDF（可选择文字的 PDF）`
              ));
            }
            return;
          }

          resolve({
            text: cleanText,
            pages: pageCount,
            info: pdfData.Meta || {},
          });
        } catch (error) {
          console.error("[Parser] Error processing PDF data:", error);
          reject(error);
        }
      });

      pdfParser.parseBuffer(buffer);
    });
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
