/**
 * PDF Viewer Component - 极简艺术风格
 */

"use client";

import React from "react";
import { FileText, Sparkles } from "lucide-react";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";

interface PDFViewerProps {
  className?: string;
}

export function PDFViewer({ className = "" }: PDFViewerProps) {
  const { activePdfId, pdfs } = usePDF();

  const activePdf = activePdfId ? pdfs.get(activePdfId) : null;

  if (!activePdf) {
    return (
    <div
      className={`flex h-full flex-col items-center justify-center text-center ${className}`}
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center blur-xl">
          <FileText className="h-24 w-24 text-foreground/5" />
        </div>
        <FileText className="relative h-16 w-16 text-foreground/20 mb-6" />
      </div>
      <p className="text-sm text-muted-foreground/70 max-w-[200px]">
        {pdfs.size > 0 ? "选择左侧文件开始阅读" : "上传 PDF 开始使用"}
      </p>
    </div>
  );
  }

  if (activePdf.parseStatus !== ParseStatus.COMPLETED || !activePdf.textContent) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="relative inline-flex justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-accent/20 blur-xl" />
            <Sparkles className="relative h-10 w-10 text-accent/60" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground/70">
            {activePdf.parseStatus === ParseStatus.PARSING
              ? "正在解析文档..."
              : "准备就绪"}
          </p>
        </div>
      </div>
    );
  }

  // 预览内容（截取前500字符）
  const previewText = activePdf.textContent.slice(0, 500) + (activePdf.textContent.length > 500 ? "..." : "");

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 文件信息卡片 */}
      <div className="mb-4 pb-4 border-b border-border/30">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground/90 mb-1">
              {activePdf.fileName}
            </h2>
            <p className="text-xs text-muted-foreground/50">
              {activePdf.pageCount} 页 · {(activePdf.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          {activePdf.parseStatus === ParseStatus.COMPLETED && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-700 text-[10px] font-medium">
              <span className="h-1 w-1 rounded-full bg-green-500" />
              已解析
            </span>
          )}
        </div>
      </div>

      {/* 内容预览 - 极简设计 */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="prose prose-sm max-w-none">
          <article className="text-xs leading-relaxed text-foreground/70 whitespace-pre-wrap break-words">
            {previewText}
          </article>
        </div>
      </div>

      {/* 底部提示 */}
      {activePdf.textContent.length > 500 && (
        <div className="mt-3 pt-3 border-t border-border/20 text-center">
          <p className="text-[10px] text-muted-foreground/40">
            内容预览（前 500 字符）
          </p>
        </div>
      )}
    </div>
  );
}
