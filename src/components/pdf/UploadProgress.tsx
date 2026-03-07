/**
 * Upload Progress Component
 */

"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";

interface UploadProgressProps {
  pdfId: string;
  fileName: string;
}

export function UploadProgress({ pdfId, fileName }: UploadProgressProps) {
  const { parseStatus, uploadProgress } = usePDF();

  const status = parseStatus.get(pdfId) || ParseStatus.PENDING;
  const progress = uploadProgress.get(pdfId) || 0;

  const getStatusText = () => {
    switch (status) {
      case ParseStatus.PENDING:
        return "等待解析...";
      case ParseStatus.PARSING:
        return "解析中...";
      case ParseStatus.COMPLETED:
        return "解析完成";
      case ParseStatus.FAILED:
        return "解析失败";
      default:
        return "";
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
          {fileName}
        </span>
        <span className="text-xs text-muted-foreground">
          {status === ParseStatus.PARSING && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {getStatusText()}
            </span>
          )}
          {status !== ParseStatus.PARSING && getStatusText()}
        </span>
      </div>

      {(status === ParseStatus.PENDING || status === ParseStatus.PARSING) && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
