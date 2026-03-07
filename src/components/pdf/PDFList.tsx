/**
 * PDF List Component - 极简艺术风格
 */

"use client";

import React from "react";
import { FileText, Trash2, Loader2, FileQuestion } from "lucide-react";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";
import { cn } from "@/lib/utils/cn";

interface PDFListProps {
  className?: string;
}

export function PDFList({ className = "" }: PDFListProps) {
  const { pdfs, activePdfId, setActivePdf, removePDF, parseStatus } = usePDF();

  if (pdfs.size === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from(pdfs.values()).map((pdf, index) => {
        const isActive = pdf.id === activePdfId;
        const isParsing = pdf.parseStatus === ParseStatus.PARSING;

        return (
          <div
            key={pdf.id}
            className={`group relative flex items-center gap-3 rounded-xl p-3 transition-all duration-200 ${
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "bg-secondary/40 hover:bg-secondary/60"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 文件图标 */}
            <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? "bg-background/20" : "bg-background"
            }`}>
              {isParsing ? (
                <Loader2 className="h-4 w-4 animate-spin opacity-60" />
              ) : (
                <FileText className="h-4 w-4 opacity-60" />
              )}
            </div>

            {/* 文件信息 */}
            <button
              onClick={() => setActivePdf(pdf.id)}
              className="flex-1 text-left min-w-0"
            >
              <p className={`text-sm font-medium truncate ${
                isActive ? "text-foreground" : "text-foreground/80"
              }`}>
                {pdf.fileName}
              </p>
              <p className={`text-xs ${
                isActive ? "text-foreground/60" : "text-muted-foreground/60"
              }`}>
                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                {pdf.pageCount && ` · ${pdf.pageCount} 页`}
              </p>
            </button>

            {/* 状态指示 */}
            <div className="flex items-center gap-2">
              {isParsing && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-20" />
                    <span className="relative inset-0 rounded-full bg-current" />
                  </span>
                  处理中
                </div>
              )}

              {/* 删除按钮 */}
              <button
                onClick={() => removePDF(pdf.id)}
                className={`flex-shrink-0 rounded-lg p-2 transition-all ${
                  isActive
                    ? "hover:bg-foreground/20"
                    : "hover:bg-destructive/10 hover:text-destructive"
                }`}
                title="删除文件"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 激活指示条 */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-accent" />
            )}
          </div>
        );
      })}
    </div>
  );
}
