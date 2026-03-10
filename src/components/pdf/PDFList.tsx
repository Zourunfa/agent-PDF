/**
 * PDF List Component - Ant Design Modern
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
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                borderRadius: 12,
                padding: '12px',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 32,
                  background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)',
                  borderRadius: '0 4px 4px 0'
                }} />
              )}

              {/* Icon */}
              <div style={{ flexShrink: 0, paddingLeft: isActive ? 8 : 0 }}>
                {isParsing ? (
                  <LoadingOutlined style={{ fontSize: 22, color: '#6366F1' }} />
                ) : isCompleted ? (
                  <CheckCircleOutlined style={{ fontSize: 22, color: '#10B981' }} />
                ) : isFailed ? (
                  <ExclamationCircleOutlined style={{ fontSize: 22, color: '#EF4444' }} />
                ) : (
                  <FileTextOutlined style={{ fontSize: 22, color: '#6366F1' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  strong={isActive}
                  ellipsis
                  style={{
                    fontSize: 13,
                    color: isActive ? '#6366F1' : '#1E1B4B',
                    display: 'block',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  {pdf.fileName}
                </Text>
                <Space size={6} style={{ fontSize: 11, marginTop: 2 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
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
                    <Tag color="processing" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
                      解析中
                    </Tag>
                  )}
                  {isFailed && (
                    <Tag color="error" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
                      解析失败
                    </Tag>
                  )}
                </Space>
              </div>

              {/* Actions */}
              <Space size={4} style={{ flexShrink: 0, opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0';
                }}
              >
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
                      height: 28,
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderColor: 'transparent',
                      borderRadius: 6
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
                  style={{ borderRadius: 6 }}
                />
              </Space>
            </div>
          );
        })}
      </div>

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
    </>
  );
}
