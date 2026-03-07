/**
 * PDF Uploader Component - 极简艺术风格
 */

"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
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

    // 模拟上传进度
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

        // Trigger parsing
        fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfId }),
        });

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
      className={`relative group ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed border-border/40 bg-secondary/20 p-8 transition-all duration-300 ${
          isDragging
            ? "border-accent bg-accent/5 scale-[1.02]"
            : "hover:border-border/60 hover:bg-secondary/30"
        }`}
      >
        {/* 装饰性元素 */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent/20 to-transparent" />
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-accent/20 to-transparent" />

        {/* 上传区域 */}
        <div className="relative flex flex-col items-center justify-center space-y-4">
          {/* 图标容器 */}
          <div className={`relative transition-all duration-300 ${
            isUploading ? "scale-90 opacity-50" : "group-hover:scale-110"
          }`}>
            <div className={`absolute inset-0 rounded-full bg-accent/10 blur-xl transition-opacity ${
              isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`} />
            <Upload className={`relative h-12 w-12 text-foreground/60 transition-colors ${
              isDragging ? "text-accent" : ""
            }`} />
          </div>

          {/* 文本 */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground/80">
              {isUploading ? "上传中..." : "上传 PDF 文档"}
            </p>
            <p className="text-xs text-muted-foreground/50">
              {isUploading ? `处理中... ${uploadProgress}%` : "拖拽文件到这里，或点击选择"}
            </p>
          </div>

          {/* 进度条 */}
          {isUploading && (
            <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* 选择按钮 */}
          <label className="relative inline-block">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileInput}
              disabled={isUploading}
            />
            <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isUploading
                ? "bg-muted cursor-not-allowed opacity-50"
                : "bg-foreground text-background hover:bg-foreground/90 cursor-pointer hover:shadow-lg"
            }`}>
              <FileText className="h-4 w-4" />
              {isUploading ? "处理中" : "选择文件"}
            </span>
          </label>

          {/* 提示 */}
          <p className="text-[10px] text-muted-foreground/40">
            支持 PDF 格式，最大 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
