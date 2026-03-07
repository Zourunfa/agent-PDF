/**
 * PDF Preview Component - 使用 PDF.js 渲染 PDF 页面
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";
import * as pdfjsLib from "pdfjs-dist";

// 设置 PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFPreviewProps {
  className?: string;
}

export function PDFPreview({ className = "" }: PDFPreviewProps) {
  const { activePdfId, pdfs } = usePDF();
  const activePdf = activePdfId ? pdfs.get(activePdfId) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载 PDF 文档
  useEffect(() => {
    if (!activePdf) {
      return;
    }

    // 允许在任何状态下预览PDF（PENDING, PARSING, COMPLETED）
    const loadPDF = async () => {
      setLoading(true);
      setError(null);

      try {
        // 构建PDF文件URL
        const pdfUrl = `/api/pdf/${activePdf.id}`;

        console.log('[PDFPreview] Loading PDF from:', pdfUrl);
        console.log('[PDFPreview] PDF status:', activePdf.parseStatus);

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;

        console.log('[PDFPreview] PDF loaded successfully, pages:', pdf.numPages);

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error("[PDFPreview] 加载PDF失败:", err);
        setError("加载PDF失败: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [activePdf]);

  // 渲染当前页面
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      setLoading(true);

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        // 计算旋转后的尺寸
        const viewport = page.getViewport({ scale, rotation: rotation as any });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("渲染页面失败:", err);
      } finally {
        setLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, rotation]);

  // 页面导航
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 缩放控制
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  // 旋转控制
  const rotate = () => setRotation((prev) => (prev + 90) % 360);

  // 没有选择PDF
  if (!activePdf) {
    return (
      <div className={`flex items-center justify-center text-center min-h-[200px] ${className}`}>
        <div className="fade-in-up">
          <p className="text-xs text-indigo-400 font-medium">
            {pdfs.size > 0 ? "选择文件查看" : "上传 PDF 开始"}
          </p>
        </div>
      </div>
    );
  }

  // 加载失败
  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center">
          <p className="text-xs text-red-500 font-medium">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setPdfDoc(null);
            }}
            className="mt-2 px-3 py-1 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/50 backdrop-blur-sm rounded-t-xl border border-indigo-100/50">
        {/* 页面导航 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg bg-white border border-indigo-100 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-indigo-600" />
          </button>

          <span className="text-xs font-semibold text-indigo-700 min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg bg-white border border-indigo-100 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-4 w-4 text-indigo-600" />
          </button>
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg bg-white border border-indigo-100 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ZoomOut className="h-3.5 w-3.5 text-indigo-600" />
          </button>

          <span className="text-xs font-semibold text-indigo-700 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-1.5 rounded-lg bg-white border border-indigo-100 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ZoomIn className="h-3.5 w-3.5 text-indigo-600" />
          </button>
        </div>

        {/* 旋转控制 */}
        <button
          onClick={rotate}
          className="p-1.5 rounded-lg bg-white border border-indigo-100 hover:bg-indigo-50 transition-all"
        >
          <RotateCw className="h-3.5 w-3.5 text-indigo-600" />
        </button>
      </div>

      {/* PDF 渲染区域 */}
      <div className="flex-1 overflow-auto bg-indigo-50/50 rounded-b-xl border border-t-0 border-indigo-100/50 flex items-center justify-center p-4">
        {loading && !pdfDoc ? (
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-indigo-500">加载中...</p>
          </div>
        ) : (
          <div className="relative">
            {/* 解析状态指示器 */}
            {activePdf.parseStatus === ParseStatus.PARSING && (
              <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-amber-500 text-white text-[10px] font-semibold rounded-full shadow-lg animate-pulse">
                解析中...
              </div>
            )}
            {activePdf.parseStatus === ParseStatus.PENDING && (
              <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-blue-500 text-white text-[10px] font-semibold rounded-full shadow-lg">
                等待解析
              </div>
            )}
            <div className="relative shadow-lg rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="mt-3 px-3 py-2 bg-white/50 backdrop-blur-sm rounded-lg border border-indigo-100/50">
        <p className="text-[10px] font-semibold text-indigo-700 truncate">
          {activePdf.fileName}
        </p>
        <p className="text-[9px] text-indigo-500/80 mt-0.5">
          {activePdf.pageCount} 页 · {(activePdf.fileSize / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
