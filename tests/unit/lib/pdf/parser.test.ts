/**
 * PDF parser tests
 */

import { parsePDF, extractTextFromPDF, isValidPDFText } from "@/lib/pdf/parser";

// Mock pdf-parse
jest.mock("pdf-parse", () => {
  return jest.fn(() => Promise.resolve({
    text: "Sample PDF content",
    numpages: 3,
    info: { Title: "Test PDF" },
  }));
});

import pdf from "pdf-parse";

describe("PDF Parser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractTextFromPDF", () => {
    it("should extract text from PDF buffer", async () => {
      const buffer = Buffer.from("mock pdf content");

      const text = await extractTextFromPDF(buffer);

      expect(text).toBe("Sample PDF content");
      expect(pdf).toHaveBeenCalledWith(buffer);
    });

    it("should handle parsing errors", async () => {
      (pdf as jest.Mock).mockRejectedValueOnce(new Error("Parse error"));

      const buffer = Buffer.from("invalid pdf");

      await expect(extractTextFromPDF(buffer)).rejects.toThrow("Failed to parse PDF");
    });
  });

  describe("parsePDF", () => {
    it("should parse PDF and return detailed info", async () => {
      const buffer = Buffer.from("mock pdf content");

      const result = await parsePDF(buffer);

      expect(result.text).toBe("Sample PDF content");
      expect(result.pages).toBe(3);
      expect(result.info).toEqual({ Title: "Test PDF" });
    });
  });

  describe("isValidPDFText", () => {
    it("should return true for valid text content", () => {
      expect(isValidPDFText("This is a valid PDF content with enough text")).toBe(true);
    });

    it("should return false for empty text", () => {
      expect(isValidPDFText("")).toBe(false);
    });

    it("should return false for text shorter than 50 characters", () => {
      expect(isValidPDFText("Short")).toBe(false);
    });
  });
});
