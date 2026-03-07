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
  const ocrStartTime = Date.now();
  
  try {
    // Convert PDF pages to PNG images
    const convertStart = Date.now();
    console.log("[OCR Parser] Converting PDF to images...");
    const pngPages = await pdfToPng(buffer.buffer as ArrayBuffer, {
      disableFontFace: false,
      useSystemFonts: false,
      viewportScale: 2.0, // Higher resolution for better OCR
    });
    const convertTime = Date.now() - convertStart;
    
    console.log(`[OCR Parser] ✓ Converted to ${pngPages.length} images (${convertTime}ms)`);
    
    // Initialize Tesseract worker
    const workerStart = Date.now();
    console.log("[OCR Parser] Initializing OCR engine...");
    
    // Use local training data files
    const worker = await createWorker('chi_sim+eng', 1, {
      langPath: process.cwd(), // Use training data from project root
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR Parser] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    const workerTime = Date.now() - workerStart;
    console.log(`[OCR Parser] ✓ OCR engine initialized (${workerTime}ms)`);
    
    let fullText = "";
    const recognizeStart = Date.now();
    
    // Process each page
    for (let i = 0; i < pngPages.length; i++) {
      const pageStart = Date.now();
      console.log(`[OCR Parser] Processing page ${i + 1}/${pngPages.length}...`);
      
      const pageContent = pngPages[i]?.content;
      if (!pageContent) {
        console.log(`[OCR Parser] ⚠️  Page ${i + 1}: No content`);
        continue;
      }
      
      const { data } = await worker.recognize(pageContent as any);
      const pageText = data.text.trim();
      const pageTime = Date.now() - pageStart;
      
      if (pageText) {
        fullText += pageText + "\n\n";
        console.log(`[OCR Parser] ✓ Page ${i + 1}: ${pageText.length} characters (${pageTime}ms)`);
      } else {
        console.log(`[OCR Parser] ⚠️  Page ${i + 1}: No text detected (${pageTime}ms)`);
      }
    }
    const recognizeTime = Date.now() - recognizeStart;
    
    // Cleanup
    await worker.terminate();
    
    const cleanText = fullText.trim();
    const totalTime = Date.now() - ocrStartTime;
    
    console.log(`[OCR Parser] ✓ OCR completed: ${pngPages.length} pages, ${cleanText.length} characters`);
    console.log(`[OCR Parser] ⏱️ OCR timing:`);
    console.log(`[OCR Parser]   - PDF to images: ${convertTime}ms`);
    console.log(`[OCR Parser]   - Worker init: ${workerTime}ms`);
    console.log(`[OCR Parser]   - Text recognition: ${recognizeTime}ms`);
    console.log(`[OCR Parser]   - Total: ${totalTime}ms`);
    
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
