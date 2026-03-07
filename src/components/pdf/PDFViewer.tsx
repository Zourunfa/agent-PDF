/**
 * PDF Viewer Component - Simple iframe preview
 */

"use client";

import React from "react";
import { Empty } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { usePDF } from "@/contexts/PDFContext";

export function PDFViewer() {
  const { activePdfId } = usePDF();

  if (!activePdfId) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 64, color: '#D1D5DB' }} />}
          description="选择 PDF 文件进行预览"
        />
      </div>
    );
  }

  const pdfUrl = `/api/pdf/${activePdfId}`;

  return (
    <iframe
      src={pdfUrl}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: 8
      }}
      title="PDF Preview"
    />
  );
}
