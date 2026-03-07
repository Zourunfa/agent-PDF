/**
 * PDF List Component - 现代设计
 */

"use client";

import React from "react";
import { FileText, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";
import { cn } from "@/lib/utils/cn";

interface PDFListProps {
  className?: string;
}

export function PDFList({ className = "" }: PDFListProps) {
  const { pdfs, activePdfId, setActivePdf, removePDF } = usePDF();

  if (pdfs.size === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        已上传文档 ({pdfs.size})
      </h3>
      {Array.from(pdfs.values()).map((pdf, index) => {
        const isActive = pdf.id === activePdfId;
        const isParsing = pdf.parseStatus === ParseStatus.PARSING;
        const isCompleted = pdf.parseStatus === ParseStatus.COMPLETED;

        return (
          <div
            key={pdf.id}
            className={`group relative flex items-center gap-3 rounded-xl p-3.5 transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
            onClick={() => setActivePdf(pdf.id)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 文件图标 */}
            <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? "bg-white/20" : "bg-gradient-to-br from-blue-50 to-purple-50"
            }`}>
              {isParsing ? (
                <Loader2 className={`h-5 w-5 animate-spin ${isActive ? "text-white" : "text-blue-600"}`} />
              ) : isCompleted ? (
                <CheckCircle2 className={`h-5 w-5 ${isActive ? "text-white" : "text-green-600"}`} />
              ) : (
                <FileText className={`h-5 w-5 ${isActive ? "text-white" : "text-blue-600"}`} />
              )}
            </div>

            {/* 文件信息 */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                isActive ? "text-white" : "text-gray-900"
              }`}>
                {pdf.fileName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs ${
                  isActive ? "text-white/80" : "text-gray-500"
                }`}>
                  {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                {pdf.pageCount && (
                  <>
                    <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-300"}`}>·</span>
                    <p className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                      {pdf.pageCount} 页
                    </p>
                  </>
                )}
                {isParsing && (
                  <>
                    <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-300"}`}>·</span>
                    <p className={`text-xs ${isActive ? "text-white/80" : "text-blue-600"}`}>
                      解析中...
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* 删除按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePDF(pdf.id);
              }}
              className={`flex-shrink-0 rounded-lg p-2 transition-all opacity-0 group-hover:opacity-100 ${
                isActive
                  ? "hover:bg-white/20"
                  : "hover:bg-red-50 hover:text-red-600"
              }`}
              title="删除文件"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* 激活指示条 */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-white shadow-lg" />
            )}
          </div>
        );
      })}
    </div>
  );
}
