/**
 * PDF Uploader Component - 现代设计
 */

"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { usePDF } from "@/contexts/PDFContext";
import { validatePDFFile } from "@/lib/utils/validation";

interface PDFUploaderProps {
  className?: string;
}

export function PDFUploader({ className = "" }: PDFUploaderProps) {
  const { addPDF } = usePDF();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const { pdfId, fileName, fileSize, uploadedAt, parseStatus } = result.data;

        // Add PDF to context
        addPDF({
          id: pdfId,
          fileName,
          sanitizedName: validation.sanitizedName || fileName,
          fileSize,
          mimeType: file.type,
          uploadedAt: new Date(uploadedAt),
          parseStatus,
          textContent: null,
          pageCount: null,
          tempPath: null,
        });

        // Trigger PDF parsing
        console.log(`[Uploader] Triggering parse for PDF: ${pdfId}`);
        const parseResponse = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfId }),
        });

        const parseResult = await parseResponse.json();
        console.log(`[Uploader] Parse response:`, parseResult);

        if (!parseResult.success) {
          console.error(`[Uploader] Parse failed:`, parseResult.error);
        }

        setUploadProgress(100);
      } else {
        alert(result.error?.message || "上传失败");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("上传失败，请重试");
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [addPDF]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find((f) => f.type === "application/pdf");

    if (pdfFile) {
      handleFile(pdfFile);
    } else {
      alert("请上传 PDF 文件");
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      className={`relative ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
          isDragging
            ? "border-cyan-400 bg-cyan-50/80 shadow-soft-lg scale-[1.01]"
            : "border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white hover:border-cyan-300 hover:shadow-soft"
        }`}
      >
        <div className="relative p-10">
          {/* Upload Icon */}
          <div className={`flex flex-col items-center justify-center space-y-5 transition-all duration-300 ${
            isUploading ? "opacity-50" : ""
          }`}>
            <div className={`relative transition-all duration-300 ${
              isDragging ? "scale-110" : "hover:scale-105"
            }`}>
              {isUploading && uploadProgress === 100 ? (
                <div className="flex items-center justify-center h-16 w-16 bg-emerald-100 rounded-2xl shadow-soft">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
              ) : (
                <div className={`flex items-center justify-center h-16 w-16 rounded-2xl transition-all shadow-soft ${
                  isDragging
                    ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-glow"
                    : "bg-gradient-to-br from-blue-600 to-cyan-500"
                }`}>
                  <Upload className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <p className="text-base font-semibold text-slate-900">
                {isUploading
                  ? uploadProgress === 100 ? "上传成功！" : "上传中..."
                  : isDragging ? "松开上传文件" : "上传 PDF 文档"}
              </p>
              <p className="text-sm text-slate-500">
                {isUploading
                  ? `处理中 ${uploadProgress}%`
                  : "拖拽文件到这里，或点击选择文件"}
              </p>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Select Button */}
            {!isUploading && (
              <label className="relative inline-block cursor-pointer group">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-soft hover:shadow-soft-lg hover:scale-105 transition-all duration-200">
                  <FileText className="h-4 w-4" />
                  选择文件
                </span>
              </label>
            )}

            {/* Hint */}
            <p className="text-xs text-slate-400">
              支持 PDF 格式 · 最大 10MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
