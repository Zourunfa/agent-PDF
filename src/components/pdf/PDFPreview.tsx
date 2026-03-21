/**
 * PDF Preview Component - Ant Design Modern
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Tooltip, Spin, Empty, Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { usePDF } from '@/contexts/PDFContext';
import { ParseStatus } from '@/types/pdf';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Custom icons for Ant Design
const ZoomInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M8 11h6" />
  </svg>
);

const RotateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

interface PDFPreviewProps {
  className?: string;
}

export function PDFPreview({ className = '' }: PDFPreviewProps) {
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

  useEffect(() => {
    if (!activePdf) return;

    const loadPDF = async () => {
      setLoading(true);
      setError(null);

      try {
        let pdfData: string | ArrayBuffer;

        if (activePdf.base64Data) {
          const binaryString = atob(activePdf.base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfData = bytes;
        } else {
          const pdfUrl = `/api/pdf/${activePdf.id}`;
          pdfData = pdfUrl;
        }

        const loadingTask = pdfjsLib.getDocument({
          data: typeof pdfData === 'string' ? undefined : pdfData,
          url: typeof pdfData === 'string' ? pdfData : undefined,
          cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('[PDFPreview] 加载PDF失败:', err);
        setError('加载PDF失败');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [activePdf]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      setLoading(true);

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        const viewport = page.getViewport({ scale, rotation: rotation as any });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('渲染页面失败:', err);
      } finally {
        setLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, rotation]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);

  if (!activePdf) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: '#D1D5DB' }} />}
          description="选择文件查看"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center">
          <p className="text-xs text-red-500 font-medium">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setPdfDoc(null);
            }}
            style={{ marginTop: 8 }}
          >
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/50 backdrop-blur-sm rounded-t-xl border border-black/5">
        {/* Page Navigation */}
        <Space size={4}>
          <Button
            size="small"
            icon={<ChevronLeft />}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ borderRadius: 6 }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 50, textAlign: 'center' }}>
            {currentPage} / {totalPages}
          </span>
          <Button
            size="small"
            icon={<ChevronRight />}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{ borderRadius: 6 }}
          />
        </Space>

        {/* Zoom Control */}
        <Space size={4}>
          <Tooltip title="缩小">
            <Button
              size="small"
              icon={<ZoomOutIcon />}
              onClick={zoomOut}
              disabled={scale <= 0.5}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <Tooltip title="放大">
            <Button
              size="small"
              icon={<ZoomInIcon />}
              onClick={zoomIn}
              disabled={scale >= 3}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
        </Space>

        {/* Rotate Control */}
        <Tooltip title="旋转">
          <Button size="small" icon={<RotateIcon />} onClick={rotate} style={{ borderRadius: 6 }} />
        </Tooltip>
      </div>

      {/* PDF Render Area */}
      <div className="flex-1 overflow-auto bg-black/5 rounded-b-xl border border-t-0 border-black/5 flex items-center justify-center p-4">
        {loading && !pdfDoc ? (
          <div className="text-center">
            <Spin size="large" />
            <p className="text-xs text-gray-500 mt-2">加载中...</p>
          </div>
        ) : (
          <div className="relative">
            {activePdf.parseStatus === ParseStatus.PARSING && (
              <Tag color="warning" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                解析中...
              </Tag>
            )}
            {activePdf.parseStatus === ParseStatus.PENDING && (
              <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                等待解析
              </Tag>
            )}
            <div className="relative shadow-lg rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="mt-3 px-3 py-2 bg-white/50 backdrop-blur-sm rounded-lg border border-black/5">
        <p className="text-[10px] font-semibold truncate">{activePdf.fileName}</p>
        <p className="text-[9px] text-gray-500 mt-0.5">
          {activePdf.pageCount} 页 · {(activePdf.fileSize / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
