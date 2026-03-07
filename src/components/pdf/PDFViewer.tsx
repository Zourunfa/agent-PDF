/**
 * PDF Viewer Component
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
      <div className={`flex items-center justify-center text-center min-h-[200px] ${className}`}>
        <div className="fade-in-up">
          <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl mx-auto mb-3 shadow-sm">
            <FileText className="h-8 w-8 text-indigo-300" />
          </div>
          <p className="text-xs text-indigo-400 font-medium">
            {pdfs.size > 0 ? "选择文件查看" : "上传 PDF 开始"}
          </p>
        </div>
      </div>
    );
  }

  if (activePdf.parseStatus !== ParseStatus.COMPLETED || !activePdf.textContent) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center fade-in-up">
          <div className="flex items-center justify-center h-14 w-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl mx-auto mb-3 shadow-sm">
            <Sparkles className="h-7 w-7 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-xs text-indigo-500 font-semibold">
            {activePdf.parseStatus === ParseStatus.PARSING ? "解析中..." : "准备就绪"}
          </p>
        </div>
      </div>
    );
  }

  const previewText = activePdf.textContent.slice(0, 500) + (activePdf.textContent.length > 500 ? "..." : "");

  return (
    <div className={`flex flex-col ${className}`}>
      {/* File Info */}
      <div className="mb-4 pb-4 border-b border-indigo-100/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-indigo-900 mb-1.5">
              {activePdf.fileName}
            </h2>
            <p className="text-[10px] text-indigo-600/80 font-medium">
              {activePdf.pageCount} 页 · {(activePdf.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          {activePdf.parseStatus === ParseStatus.COMPLETED && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100/50 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              已解析
            </span>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <article className="text-[11px] leading-relaxed text-indigo-800 whitespace-pre-wrap break-words font-medium">
          {previewText}
        </article>
      </div>

      {/* Bottom Hint */}
      {activePdf.textContent.length > 500 && (
        <div className="mt-3 pt-3 border-t border-indigo-100/50 text-center">
          <p className="text-[9px] text-indigo-400 font-medium">
            预览前 500 字符 · 共 {activePdf.textContent.length} 字符
          </p>
        </div>
      )}
    </div>
  );
}
