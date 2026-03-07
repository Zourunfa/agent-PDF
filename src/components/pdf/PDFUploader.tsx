/**
 * PDF Uploader Component - 科幻深色风格
 */

"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle2, Sparkles } from "lucide-react";
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
      {/* 拖拽时的发光边框 */}
      {isDragging && (
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur-lg opacity-75 animate-pulse-glow" />
      )}
      
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm ${
          isDragging
            ? "border-cyan-400 bg-cyan-500/10 scale-[1.02]"
            : "border-dashed border-cyan-500/30 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-slate-900/70"
        }`}
      >
        <div className="relative p-8">
          <div className={`flex flex-col items-center justify-center space-y-4 transition-all duration-300 ${
            isUploading ? "opacity-50" : ""
          }`}>
            {/* Upload Icon */}
            <div className="relative">
              {/* 背景发光效果 */}
              <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl transition-all duration-300 ${
                isDragging ? "scale-150 opacity-100" : "scale-100 opacity-50"
              }`} />
              
              <div className={`relative transition-all duration-300 ${
                isDragging ? "scale-110 rotate-12" : "hover:scale-105"
              }`}>
                {isUploading && uploadProgress === 100 ? (
                  <div className="flex items-center justify-center h-14 w-14 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                ) : (
                  <div className={`flex items-center justify-center h-14 w-14 rounded-xl transition-all border ${
                    isDragging
                      ? "bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-cyan-400/50 neon-glow-cyan"
                      : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30"
                  }`}>
                    <Upload className={`h-6 w-6 transition-all ${
                      isDragging ? "text-cyan-300" : "text-cyan-400"
                    }`} />
                  </div>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <p className="text-sm font-semibold text-cyan-400">
                {isUploading
                  ? uploadProgress === 100 ? "✓ 上传成功" : "上传中..."
                  : isDragging ? "松开上传文件" : "上传 PDF 文档"}
              </p>
              <p className="text-xs text-cyan-400/60">
                {isUploading
                  ? `处理中 ${uploadProgress}%`
                  : "拖拽文件到这里，或点击选择"}
              </p>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="w-full max-w-xs h-1.5 bg-slate-800/50 rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 ease-out rounded-full relative"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 blur-sm opacity-50" />
                </div>
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
                {/* 按钮发光效果 */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-75 blur transition-opacity duration-300" />
                
                <span className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/50 backdrop-blur-sm transition-all duration-200 group-hover:scale-105">
                  <FileText className="h-3.5 w-3.5" />
                  选择文件
                </span>
              </label>
            )}

            {/* Hint */}
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/40">
              <Sparkles className="h-3 w-3" />
              <span>支持 PDF 格式 · 最大 10MB · 自动 OCR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
