/**
 * PDF parsing utilities using pdf2json
 */

export interface ParsedPDF {
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

/**
 * Parse PDF using pdf2json (Node.js native, no webpack issues)
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    console.log("[Parser] Parsing PDF with pdf2json...");

    // Dynamic import to avoid webpack issues
    const PDFParser = (await import("pdf2json")).default;

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, true); // null for no external handler, true for verbose

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("[Parser] PDF parse error:", errData);
        reject(new Error(`PDF parse error: ${errData.parserError || errData}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
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
                        // Decode URI encoded text
                        fullText += decodeURIComponent(r.T) + " ";
                      }
                    }
                  }
                }
              }
              fullText += "\n\n"; // Add page break
            }
          }

          const cleanText = fullText.trim();
          console.log(`[Parser] ✓ PDF parsed: ${pageCount} pages`);
          console.log(`[Parser] ✓ Extracted ${cleanText.length} characters`);

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

      // Parse the buffer
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
