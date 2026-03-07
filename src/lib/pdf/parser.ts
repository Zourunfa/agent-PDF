/**
 * PDF parsing utilities using pdf2json
 * Simplified with strict timeout to avoid hanging
 */

export interface ParsedPDF {
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

/**
 * Parse PDF using pdf2json with strict timeout
 * Simplified to avoid complex parser issues
 */
export async function parsePDF(buffer: Buffer, useOCR: boolean = false): Promise<ParsedPDF> {
  // If OCR is explicitly requested, use it directly
  if (useOCR) {
    console.log("[Parser] OCR mode requested, using OCR parser...");
    const { parseScannedPDF } = await import("./ocr-parser");
    return parseScannedPDF(buffer);
  }

  console.log("[Parser] Parsing PDF with pdf2json...");
  console.log("[Parser] Buffer size:", buffer.length, "bytes");

  try {
    // Dynamic import to avoid webpack issues
    const PDFParser = (await import("pdf2json")).default;
    console.log("[Parser] ✓ PDFParser imported");

    return new Promise(async (resolve, reject) => {
      // Increase timeout to 6 seconds for Vercel
      const timeout = setTimeout(() => {
        console.error("[Parser] ✗ Timeout after 6 seconds");
        reject(new Error("PDF 解析超时 - 文件可能过于复杂"));
      }, 6000);

      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        clearTimeout(timeout);
        console.error("[Parser] ✗ Parse error:", errData);
        reject(new Error(`PDF 解析错误: ${errData.parserError || errData}`));
      });

      pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
        clearTimeout(timeout);
        console.log("[Parser] ✓ Parse complete");
        
        try {
          let fullText = "";
          let pageCount = 0;

          if (pdfData.Pages) {
            pageCount = pdfData.Pages.length;
            
            for (const page of pdfData.Pages) {
              if (page.Texts) {
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
          console.log(`[Parser] ✓ Extracted ${cleanText.length} chars from ${pageCount} pages`);

          // Check if scanned PDF
          if (cleanText.length < 50) {
            console.warn(`[Parser] ⚠️ Insufficient text, may be scanned PDF`);
            reject(new Error(
              "此 PDF 文件可能是扫描件，文本内容不足。\n\n" +
              "建议：\n" +
              "1. 上传文本型 PDF（可选择文字的 PDF）\n" +
              "2. 或使用 OCR 工具预处理"
            ));
            return;
          }

          resolve({
            text: cleanText,
            pages: pageCount,
            info: pdfData.Meta || {},
          });
        } catch (error) {
          console.error("[Parser] ✗ Data processing error:", error);
          reject(error);
        }
      });

      try {
        console.log("[Parser] → Calling parseBuffer...");
        pdfParser.parseBuffer(buffer);
      } catch (parseError) {
        clearTimeout(timeout);
        console.error("[Parser] ✗ parseBuffer error:", parseError);
        reject(parseError);
      }
    });
  } catch (error) {
    console.error("[Parser] ✗ Error:", error);
    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : String(error)}`);
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
