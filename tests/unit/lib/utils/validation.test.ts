/**
 * Validation utilities tests
 */

import { validatePDFFile, validateChatInput, validatePdfId } from "@/lib/utils/validation";

describe("Validation Utilities", () => {
  describe("validatePDFFile", () => {
    it("should validate a valid PDF file", () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      file.size = 1024 * 1024; // 1MB

      const result = validatePDFFile(file);
      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBeDefined();
    });

    it("should reject files larger than 10MB", () => {
      const file = new File(["content"], "large.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 }); // 11MB

      const result = validatePDFFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10MB");
    });

    it("should reject non-PDF files", () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });

      const result = validatePDFFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("PDF");
    });

    it("should sanitize filenames", () => {
      const file = new File(["content"], "test file@#$%.pdf", { type: "application/pdf" });
      file.size = 1024;

      const result = validatePDFFile(file);
      expect(result.valid).toBe(true);
      expect(result.sanitizedName).not.toContain("@");
      expect(result.sanitizedName).not.toContain("#");
    });
  });

  describe("validateChatInput", () => {
    it("should validate non-empty input", () => {
      const result = validateChatInput("Hello AI");
      expect(result.valid).toBe(true);
    });

    it("should reject empty input", () => {
      const result = validateChatInput("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("请输入有效问题");
    });

    it("should reject whitespace-only input", () => {
      const result = validateChatInput("   ");
      expect(result.valid).toBe(false);
    });

    it("should reject input over 10000 characters", () => {
      const longInput = "a".repeat(10001);
      const result = validateChatInput(longInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10000");
    });
  });

  describe("validatePdfId", () => {
    it("should validate a non-empty PDF ID", () => {
      const result = validatePdfId("abc-123-def");
      expect(result.valid).toBe(true);
    });

    it("should reject empty PDF ID", () => {
      const result = validatePdfId("");
      expect(result.valid).toBe(false);
    });
  });
});
