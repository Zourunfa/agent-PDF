/**
 * PDF parsing utilities
 */

const pdf = require("pdf-parse");

export interface ParsedPDF {
  text: string;
  pages: number;
  info: Record<string, unknown>;
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parse PDF and return detailed information
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info || {},
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check if text content is empty or too short
 */
export function isValidPDFText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 50; // At least 50 characters
}
