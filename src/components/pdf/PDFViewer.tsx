/**
 * PDF Viewer Component - Simple iframe preview
 */

"use client";

import React, { useState } from "react";
import { Empty, Spin, Alert, Button } from "antd";
import { FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import { usePDF } from "@/contexts/PDFContext";

export function PDFViewer() {
  const { activePdfId } = usePDF();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

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

  const pdfUrl = `/api/pdf/${activePdfId}?t=${retryKey}`;

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}>
          <Spin size="large" tip="加载 PDF..." />
        </div>
      )}
      
      {error && (
        <div style={{ padding: 16 }}>
          <Alert
            message="PDF 加载失败"
            description="文件可能还在处理中，请稍后重试"
            type="error"
            showIcon
            action={
              <Button size="small" icon={<ReloadOutlined />} onClick={handleRetry}>
                重试
              </Button>
            }
          />
        </div>
      )}

      {!error && (
        <iframe
          key={retryKey}
          src={pdfUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 8,
            display: loading ? 'none' : 'block'
          }}
          title="PDF Preview"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}
