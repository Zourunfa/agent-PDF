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

  const parserStartTime = Date.now();
  console.log("[Parser] ⏱️ Parser timer started");
  console.log("[Parser] Parsing PDF with pdf2json...");
  console.log("[Parser] Buffer size:", buffer.length, "bytes");

  try {
    const importStart = Date.now();
    // Dynamic import to avoid webpack issues
    const PDFParser = (await import("pdf2json")).default;
    const importTime = Date.now() - importStart;
    console.log(`[Parser] ✓ PDFParser imported (${importTime}ms)`);

    return new Promise(async (resolve, reject) => {
      const promiseStart = Date.now();
      
      // Increase timeout to 6 seconds for Vercel
      const timeout = setTimeout(() => {
        const timeoutTime = Date.now() - promiseStart;
        console.error(`[Parser] ✗ Timeout after 6 seconds (actual: ${timeoutTime}ms)`);
        reject(new Error("PDF 解析超时 - 文件可能过于复杂"));
      }, 6000);

      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        clearTimeout(timeout);
        const errorTime = Date.now() - promiseStart;
        console.error(`[Parser] ✗ Parse error after ${errorTime}ms:`, errData);
        reject(new Error(`PDF 解析错误: ${errData.parserError || errData}`));
      });

      pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
        clearTimeout(timeout);
        const parseTime = Date.now() - promiseStart;
        console.log(`[Parser] ✓ Parse complete (${parseTime}ms)`);
        
        const processStart = Date.now();
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
          const processTime = Date.now() - processStart;
          const totalParserTime = Date.now() - parserStartTime;
          
          console.log(`[Parser] ✓ Extracted ${cleanText.length} chars from ${pageCount} pages`);
          console.log(`[Parser] ⏱️ Parser timing:`);
          console.log(`[Parser]   - Import: ${importTime}ms`);
          console.log(`[Parser]   - Parse: ${parseTime}ms`);
          console.log(`[Parser]   - Process: ${processTime}ms`);
          console.log(`[Parser]   - Total: ${totalParserTime}ms`);

          // Check if scanned PDF
          if (cleanText.length < 50) {
            console.warn(`[Parser] ⚠️ Insufficient text (${cleanText.length} chars), likely scanned PDF`);
            reject(new Error(
              "PDF_SCANNED"  // Use error code for better handling
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
        const bufferStart = Date.now();
        console.log("[Parser] → Calling parseBuffer...");
        pdfParser.parseBuffer(buffer);
        const bufferTime = Date.now() - bufferStart;
        console.log(`[Parser] → parseBuffer called (${bufferTime}ms), waiting for events...`);
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
