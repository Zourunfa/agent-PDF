/**
 * PDF parsing utilities using pdf2json with OCR fallback
 */

export interface ParsedPDF {
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

/**
 * Parse PDF using multiple parsers with fallback
 * 1. Try pdf-lib (lightweight, no worker issues)
 * 2. Try pdfjs-dist (most reliable for complex PDFs)
 * 3. Fallback to pdf2json
 * 4. Fallback to OCR for scanned documents
 */
export async function parsePDF(buffer: Buffer, useOCR: boolean = false): Promise<ParsedPDF> {
  // If OCR is explicitly requested, use it directly
  if (useOCR) {
    console.log("[Parser] OCR mode requested, using OCR parser...");
    const { parseScannedPDF } = await import("./ocr-parser");
    return parseScannedPDF(buffer);
  }

  // Try pdf-lib first (lightweight, no worker issues)
  try {
    console.log("[Parser] Attempting pdf-lib parser...");
    const { parsePDFWithPDFLib } = await import("./pdflib-parser");
    const result = await parsePDFWithPDFLib(buffer);
    
    // Check if text is valid
    if (result.text.length >= 50) {
      console.log("[Parser] ✓ pdf-lib parsing successful");
      return result;
    }
    
    console.warn("[Parser] ⚠️ pdf-lib returned insufficient text, trying PDF.js...");
  } catch (pdflibError) {
    console.error("[Parser] pdf-lib failed:", pdflibError);
    console.log("[Parser] → Falling back to PDF.js...");
  }

  // Try pdfjs-dist second (most reliable for complex PDFs)
  try {
    console.log("[Parser] Attempting PDF.js parser...");
    const { parsePDFWithPDFJS } = await import("./pdfjs-parser");
    const result = await parsePDFWithPDFJS(buffer);
    
    // Check if text is valid
    if (result.text.length >= 50) {
      console.log("[Parser] ✓ PDF.js parsing successful");
      return result;
    }
    
    console.warn("[Parser] ⚠️ PDF.js returned insufficient text, trying pdf2json...");
  } catch (pdfjsError) {
    console.error("[Parser] PDF.js failed:", pdfjsError);
    console.log("[Parser] → Falling back to pdf2json...");
  }

  // Fallback to pdf2json
  try {
    console.log("[Parser] Parsing PDF with pdf2json...");
    console.log("[Parser] Buffer size:", buffer.length, "bytes");
    console.log("[Parser] → Importing PDFParser...");

    // Dynamic import to avoid webpack issues
    const PDFParser = (await import("pdf2json")).default;
    console.log("[Parser] ✓ PDFParser imported successfully");
    console.log("[Parser] → Creating Promise wrapper...");

    return new Promise(async (resolve, reject) => {
      console.log("[Parser] → Inside Promise executor");
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error("[Parser] ✗ PDF parsing timeout after 7 seconds");
        reject(new Error("PDF parsing timeout - file may be too complex or corrupted"));
      }, 7000);
      console.log("[Parser] ✓ Timeout set (7s)");

      console.log("[Parser] → Creating PDFParser instance...");
      const pdfParser = new PDFParser(null, true);
      console.log("[Parser] ✓ PDFParser instance created");

      console.log("[Parser] → Attaching event listeners...");
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        clearTimeout(timeout);
        console.error("[Parser] ✗ pdfParser_dataError event fired");
        console.error("[Parser] PDF parse error:", errData);
        reject(new Error(`PDF parse error: ${errData.parserError || errData}`));
      });
      console.log("[Parser] ✓ dataError listener attached");

      pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
        clearTimeout(timeout);
        console.log("[Parser] ✓ pdfParser_dataReady event fired");
        console.log("[Parser] → Processing PDF data...");
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

      try {
        console.log("[Parser] Calling parseBuffer...");
        pdfParser.parseBuffer(buffer);
        console.log("[Parser] parseBuffer called, waiting for events...");
      } catch (parseError) {
        clearTimeout(timeout);
        console.error("[Parser] parseBuffer error:", parseError);
        reject(parseError);
      }
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
