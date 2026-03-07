/**
 * PDF List Component - Ant Design
 */

"use client";

import React, { useState } from "react";
import { Typography, Tag, Button, Space, Empty } from "antd";
import { FileTextOutlined, DeleteOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EditOutlined } from "@ant-design/icons";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";
import { ManualTextInput } from "./ManualTextInput";

const { Text } = Typography;

export function PDFList() {
  const { pdfs, activePdfId, setActivePdf, removePDF } = usePDF();
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ id: string; fileName: string } | null>(null);

  const pdfList = Array.from(pdfs.values());

  if (pdfList.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无文档"
        style={{ padding: '24px 0' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {pdfList.map((pdf) => {
        const isActive = pdf.id === activePdfId;
        const isParsing = pdf.parseStatus === ParseStatus.PARSING;
        const isCompleted = pdf.parseStatus === ParseStatus.COMPLETED;
        const isFailed = pdf.parseStatus === ParseStatus.FAILED;

        return (
          <div
            key={pdf.id}
            onClick={() => setActivePdf(pdf.id)}
            style={{
              cursor: 'pointer',
              backgroundColor: isActive ? '#F0F5FF' : 'transparent',
              borderRadius: 8,
              padding: '8px 12px',
              border: isActive ? '1px solid #ADC6FF' : '1px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#FAFAFA';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Icon */}
            <div style={{ flexShrink: 0 }}>
              {isParsing ? (
                <LoadingOutlined style={{ fontSize: 20, color: '#6366F1' }} />
              ) : isCompleted ? (
                <CheckCircleOutlined style={{ fontSize: 20, color: '#10B981' }} />
              ) : isFailed ? (
                <ExclamationCircleOutlined style={{ fontSize: 20, color: '#EF4444' }} />
              ) : (
                <FileTextOutlined style={{ fontSize: 20, color: '#6366F1' }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                strong={isActive}
                ellipsis
                style={{
                  fontSize: 13,
                  color: isActive ? '#1E1B4B' : '#4B5563',
                  display: 'block',
                }}
              >
                {pdf.fileName}
              </Text>
              <Space size={4} style={{ fontSize: 11 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {(pdf.fileSize / 1024 / 1024).toFixed(1)} MB
                </Text>
                {pdf.pageCount && (
                  <>
                    <Text type="secondary">·</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {pdf.pageCount} 页
                    </Text>
                  </>
                )}
                {isParsing && (
                  <>
                    <Text type="secondary">·</Text>
                    <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>
                      解析中
                    </Tag>
                  </>
                )}
                {isFailed && (
                  <>
                    <Text type="secondary">·</Text>
                    <Tag color="error" style={{ fontSize: 10, margin: 0 }}>
                      解析失败
                    </Tag>
                  </>
                )}
              </Space>
            </div>

            {/* Actions */}
            <Space size={4} style={{ flexShrink: 0 }}>
              {isFailed && (
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPdf({ id: pdf.id, fileName: pdf.fileName });
                    setManualInputVisible(true);
                  }}
                  style={{ 
                    fontSize: 11, 
                    height: 24,
                    background: '#6366F1',
                    borderColor: '#6366F1'
                  }}
                >
                  手动输入
                </Button>
              )}
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  removePDF(pdf.id);
                }}
                style={{ opacity: 0.6, flexShrink: 0 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.6';
                }}
              />
            </Space>
          </div>
        );
      })}

      {/* Manual Text Input Modal */}
      {selectedPdf && (
        <ManualTextInput
          pdfId={selectedPdf.id}
          fileName={selectedPdf.fileName}
          visible={manualInputVisible}
          onClose={() => {
            setManualInputVisible(false);
            setSelectedPdf(null);
          }}
        />
      )}
    </div>
  );
}
