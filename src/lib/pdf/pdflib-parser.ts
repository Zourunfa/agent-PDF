/**
 * PDF parsing using pdf-lib
 * Lightweight and reliable for text extraction
 */

import { ParsedPDF } from "./parser";

/**
 * Parse PDF using pdf-lib
 */
export async function parsePDFWithPDFLib(buffer: Buffer): Promise<ParsedPDF> {
  console.log("[PDFLib Parser] Starting pdf-lib parsing...");
  console.log("[PDFLib Parser] Buffer size:", buffer.length, "bytes");

  try {
    // Import pdf-lib dynamically
    const { PDFDocument } = await import("pdf-lib");
    console.log("[PDFLib Parser] ✓ pdf-lib imported");

    // Load the PDF document
    console.log("[PDFLib Parser] → Loading PDF document...");
    const pdfDoc = await PDFDocument.load(buffer, { 
      ignoreEncryption: true,
      updateMetadata: false,
    });
    console.log("[PDFLib Parser] ✓ PDF loaded");

    const numPages = pdfDoc.getPageCount();
    console.log(`[PDFLib Parser] ✓ Page count: ${numPages}`);

    let fullText = "";

    // Extract text from each page
    for (let i = 0; i < numPages; i++) {
      console.log(`[PDFLib Parser] → Processing page ${i + 1}/${numPages}...`);
      
      const page = pdfDoc.getPage(i);
      
      // Get page content stream
      const contents = page.node.Contents;
      
      if (contents) {
        try {
          // Get the actual content stream
          const contentStream = typeof contents === 'function' ? contents() : contents;
          
          if (contentStream && 'contents' in contentStream) {
            // Extract text operators from content stream
            const contentBytes = (contentStream as any).contents;
            const contentText = new TextDecoder().decode(contentBytes as Uint8Array);
            
            // Simple text extraction from content stream
            // Look for text between parentheses (Tj operator) or brackets (TJ operator)
            const textMatches = contentText.matchAll(/\(([^)]*)\)/g);
            for (const match of textMatches) {
              if (match[1]) {
                // Decode PDF string encoding
                const decoded = match[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\r/g, '\r')
                  .replace(/\\t/g, '\t')
                  .replace(/\\\\/g, '\\')
                  .replace(/\\([()])/g, '$1');
                fullText += decoded + " ";
              }
            }
          }
          
          fullText += "\n\n";
        } catch (pageError) {
          console.warn(`[PDFLib Parser] ⚠️ Could not extract text from page ${i + 1}:`, pageError);
        }
      }
    }

    const cleanText = fullText.trim();
    console.log(`[PDFLib Parser] ✓ Extracted ${cleanText.length} characters from ${numPages} pages`);

    return {
      text: cleanText,
      pages: numPages,
      info: {},
    };
  } catch (error) {
    console.error("[PDFLib Parser] Error:", error);
    throw new Error(`pdf-lib parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
