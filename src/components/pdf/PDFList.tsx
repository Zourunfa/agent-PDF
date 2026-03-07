/**
 * PDF List Component - Ant Design
 */

"use client";

import React from "react";
import { List, Typography, Tag, Button, Space, Empty } from "antd";
import { FileTextOutlined, DeleteOutlined, LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { usePDF } from "@/contexts/PDFContext";
import { ParseStatus } from "@/types/pdf";

const { Text } = Typography;

export function PDFList() {
  const { pdfs, activePdfId, setActivePdf, removePDF } = usePDF();

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
    <List
      size="small"
      dataSource={pdfList}
      renderItem={(pdf) => {
        const isActive = pdf.id === activePdfId;
        const isParsing = pdf.parseStatus === ParseStatus.PARSING;
        const isCompleted = pdf.parseStatus === ParseStatus.COMPLETED;

        return (
          <List.Item
            key={pdf.id}
            onClick={() => setActivePdf(pdf.id)}
            style={{
              cursor: 'pointer',
              backgroundColor: isActive ? '#F0F5FF' : 'transparent',
              borderRadius: 8,
              marginBottom: 4,
              padding: '8px 12px',
              border: isActive ? '1px solid #ADC6FF' : '1px solid transparent',
              transition: 'all 0.2s',
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
            <List.Item.Meta
              avatar={
                isParsing ? (
                  <LoadingOutlined style={{ fontSize: 20, color: '#6366F1' }} />
                ) : isCompleted ? (
                  <CheckCircleOutlined style={{ fontSize: 20, color: '#10B981' }} />
                ) : (
                  <FileTextOutlined style={{ fontSize: 20, color: '#6366F1' }} />
                )
              }
              title={
                <Text
                  strong={isActive}
                  ellipsis
                  style={{
                    fontSize: 13,
                    color: isActive ? '#1E1B4B' : '#4B5563',
                  }}
                >
                  {pdf.fileName}
                </Text>
              }
              description={
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
                </Space>
              }
            />
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                removePDF(pdf.id);
              }}
              style={{ opacity: 0.6 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
              }}
            />
          </List.Item>
        );
      }}
    />
  );
}
