/**
 * PDF List Component - Ant Design Modern
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Tag, Button, Space, Empty, Spin, Modal, message } from 'antd';
import {
  FileTextOutlined,
  DeleteOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { usePDF } from '@/contexts/PDFContext';
import { useAuth } from '@/contexts/AuthContext';
import { ParseStatus } from '@/types/pdf';
import { ManualTextInput } from './ManualTextInput';

const { Text } = Typography;

interface PDFListItem {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  parseStatus: 'pending' | 'parsing' | 'completed' | 'failed';
  uploadedAt: string;
  conversationCount: number;
  lastConversationAt: string | null;
}

// 统一的 PDF 列表项类型（用于显示）
interface DisplayPDFItem {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  parseStatus: ParseStatus;
  uploadedAt: string;
  conversationCount?: number;
  lastConversationAt?: string | null;
}

export function PDFList() {
  const { pdfs, activePdfId, setActivePdf, removePDF, addPDF } = usePDF();
  const { user } = useAuth();
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ id: string; fileName: string } | null>(null);
  const [apiPdfs, setApiPdfs] = useState<PDFListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 从 API 获取 PDF 列表（仅登录用户）
  useEffect(() => {
    // 非登录用户不请求历史列表
    if (!user) {
      console.log('[PDFList] 未登录，跳过历史 PDF 列表加载');
      return;
    }

    const fetchPDFList = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[PDFList] 正在获取 PDF 列表...');

        const response = await fetch(
          '/api/pdfs/list?limit=50&offset=0&sortBy=uploadedAt&sortOrder=desc'
        );

        if (!response.ok) {
          throw new Error(`API 错误: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data.pdfs) {
          console.log('[PDFList] 获取到', data.data.pdfs.length, '个 PDF');
          setApiPdfs(data.data.pdfs);
        } else {
          console.warn('[PDFList] API 返回异常:', data);
          setError('获取 PDF 列表失败');
        }
      } catch (err) {
        console.error('[PDFList] 获取 PDF 列表出错:', err);
        setError(err instanceof Error ? err.message : '获取 PDF 列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPDFList();
  }, [user]); // 添加 user 依赖，登录状态变化时重新加载

  // 刷新 PDF 列表
  const refreshPDFList = async () => {
    // 非登录用户不刷新
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        '/api/pdfs/list?limit=50&offset=0&sortBy=uploadedAt&sortOrder=desc'
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.pdfs) {
          setApiPdfs(data.data.pdfs);
        }
      }
    } catch (err) {
      console.error('[PDFList] 刷新列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 处理点击 PDF（历史文件）
  const handlePdfClick = async (pdf: DisplayPDFItem) => {
    // 如果 PDF 已经在 Context 中，直接设置为活动
    if (pdfs.has(pdf.id)) {
      setActivePdf(pdf.id);
      return;
    }

    // 否则，添加到 Context（历史 PDF 需要从 API 获取信息）
    try {
      console.log('[PDFList] 加载历史 PDF:', pdf.id);

      // 将 API 数据转换为 PDFFile 格式
      const pdfFile: Parameters<typeof addPDF>[0] = {
        id: pdf.id,
        fileName: pdf.fileName,
        sanitizedName: pdf.fileName, // 使用 filename 作为 sanitizedName
        fileSize: pdf.fileSize,
        mimeType: 'application/pdf',
        uploadedAt: new Date(pdf.uploadedAt), // 转换为 Date 类型
        pageCount: pdf.pageCount,
        parseStatus: pdf.parseStatus,
        textContent: null,
        // 历史文件没有 base64Data，会让 PDFPreview 从 API 加载
        base64Data: undefined,
        tempPath: null,
      };

      addPDF(pdfFile);
      setActivePdf(pdf.id);
    } catch (error) {
      console.error('[PDFList] 加载 PDF 失败:', error);
    }
  };

  // 处理删除 PDF
  const handleDeletePDF = (pdf: { id: string; fileName: string }) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>
            确定要删除文档 <strong>"{pdf.fileName}"</strong> 吗？
          </p>
          <p style={{ color: '#ff4d4f', fontSize: 12, marginTop: 8 }}>
            此操作将同时删除该文档的所有对话记录，且无法恢复。
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          setDeletingId(pdf.id);
          await removePDF(pdf.id);
          message.success('文档已删除');
          // 从 API 列表中移除已删除的 PDF
          setApiPdfs((prev) => prev.filter((p) => p.id !== pdf.id));
        } catch (error) {
          console.error('[PDFList] 删除失败:', error);
          message.error(error instanceof Error ? error.message : '删除失败，请重试');
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // 优先使用 API 数据，如果没有则使用本地 Context 数据
  const pdfList: DisplayPDFItem[] =
    apiPdfs.length > 0
      ? apiPdfs.map((pdf) => ({
          id: pdf.id,
          fileName: pdf.filename,
          fileSize: pdf.fileSize,
          pageCount: pdf.pageCount,
          parseStatus: pdf.parseStatus as ParseStatus,
          uploadedAt: pdf.uploadedAt,
          conversationCount: pdf.conversationCount,
          lastConversationAt: pdf.lastConversationAt,
        }))
      : Array.from(pdfs.values()).map((pdf) => ({
          id: pdf.id,
          fileName: pdf.fileName,
          fileSize: pdf.fileSize,
          pageCount: pdf.pageCount,
          parseStatus: pdf.parseStatus,
          uploadedAt: pdf.uploadedAt.toISOString(),
          conversationCount: 0,
          lastConversationAt: null,
        }));

  if (pdfList.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={loading ? '加载中...' : error ? `错误: ${error}` : '暂无文档'}
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
              onClick={() => handlePdfClick(pdf)}
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
                position: 'relative',
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
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 32,
                    background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
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
                    fontWeight: isActive ? 600 : 400,
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
                      height: 28,
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderColor: 'transparent',
                      borderRadius: 6,
                    }}
                  >
                    手动输入
                  </Button>
                )}
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={deletingId === pdf.id ? <LoadingOutlined /> : <DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePDF({ id: pdf.id, fileName: pdf.fileName });
                  }}
                  loading={deletingId === pdf.id}
                  disabled={deletingId !== null}
                  style={{ borderRadius: 6 }}
                  title="删除文档"
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
