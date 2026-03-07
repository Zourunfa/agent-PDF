/**
 * OCR-based PDF parser for scanned documents
 */

import { createWorker } from 'tesseract.js';
import { pdfToPng } from 'pdf-to-png-converter';
import { ParsedPDF } from './parser';

/**
 * Parse scanned PDF using OCR
 */
export async function parseScannedPDF(buffer: Buffer): Promise<ParsedPDF> {
  console.log("[OCR Parser] Starting OCR processing for scanned PDF...");
  
  try {
    // Convert PDF pages to PNG images
    console.log("[OCR Parser] Converting PDF to images...");
    const pngPages = await pdfToPng(buffer, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0, // Higher resolution for better OCR
    });
    
    console.log(`[OCR Parser] ✓ Converted to ${pngPages.length} images`);
    
    // Initialize Tesseract worker
    console.log("[OCR Parser] Initializing OCR engine...");
    const worker = await createWorker('chi_sim+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR Parser] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    let fullText = "";
    
    // Process each page
    for (let i = 0; i < pngPages.length; i++) {
      console.log(`[OCR Parser] Processing page ${i + 1}/${pngPages.length}...`);
      
      const { data } = await worker.recognize(pngPages[i].content);
      const pageText = data.text.trim();
      
      if (pageText) {
        fullText += pageText + "\n\n";
        console.log(`[OCR Parser] ✓ Page ${i + 1}: ${pageText.length} characters`);
      } else {
        console.log(`[OCR Parser] ⚠️  Page ${i + 1}: No text detected`);
      }
    }
    
    // Cleanup
    await worker.terminate();
    
    const cleanText = fullText.trim();
    console.log(`[OCR Parser] ✓ OCR completed: ${pngPages.length} pages, ${cleanText.length} characters`);
    
    if (cleanText.length < 50) {
      throw new Error("OCR 未能识别出足够的文本内容。请确保 PDF 图片清晰可读。");
    }
    
    return {
      text: cleanText,
      pages: pngPages.length,
      info: { ocrProcessed: true },
    };
  } catch (error) {
    console.error("[OCR Parser] Error:", error);
    throw new Error(`OCR 处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if OCR is available
 */
export function isOCRAvailable(): boolean {
  try {
    require('tesseract.js');
    require('pdf-to-png-converter');
    return true;
  } catch {
    return false;
  }
}
