/**
 * PDF parsing using pdfjs-dist (Mozilla PDF.js)
 * More reliable than pdf2json for complex PDFs
 */

import { ParsedPDF } from "./parser";

/**
 * Parse PDF using pdfjs-dist
 */
export async function parsePDFWithPDFJS(buffer: Buffer): Promise<ParsedPDF> {
  console.log("[PDFJS Parser] Starting PDF.js parsing...");
  console.log("[PDFJS Parser] Buffer size:", buffer.length, "bytes");

  try {
    // Import pdfjs-dist dynamically
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
    console.log("[PDFJS Parser] ✓ pdfjs-dist imported");

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });

    console.log("[PDFJS Parser] → Loading PDF document...");
    const pdfDocument = await loadingTask.promise;
    console.log("[PDFJS Parser] ✓ PDF loaded, pages:", pdfDocument.numPages);

    const numPages = pdfDocument.numPages;
    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`[PDFJS Parser] → Processing page ${pageNum}/${numPages}...`);
      
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      fullText += pageText + "\n\n";
      
      // Cleanup
      page.cleanup();
    }

    const cleanText = fullText.trim();
    console.log(`[PDFJS Parser] ✓ Extracted ${cleanText.length} characters from ${numPages} pages`);

    // Cleanup
    await pdfDocument.cleanup();
    await pdfDocument.destroy();

    return {
      text: cleanText,
      pages: numPages,
      info: {},
    };
  } catch (error) {
    console.error("[PDFJS Parser] Error:", error);
    throw new Error(`PDF.js parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
