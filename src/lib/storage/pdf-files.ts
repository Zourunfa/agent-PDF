/**
 * In-memory PDF file storage (for demo purposes)
 * In production, this should be replaced with a database
 */

import { PDFFile } from "@/types/pdf";

export const pdfFiles = new Map<string, PDFFile>();

/**
 * Add a PDF file to storage
 */
export function addPDFFile(pdf: PDFFile): void {
  pdfFiles.set(pdf.id, pdf);
}

/**
 * Get a PDF file by ID
 */
export function getPDFFile(id: string): PDFFile | undefined {
  return pdfFiles.get(id);
}

/**
 * Get all PDF files
 */
export function getAllPDFFiles(): PDFFile[] {
  return Array.from(pdfFiles.values());
}

/**
 * Remove a PDF file
 */
export function removePDFFile(id: string): boolean {
  return pdfFiles.delete(id);
}

/**
 * Clear all PDF files
 */
export function clearAllPDFFiles(): void {
  pdfFiles.clear();
}
