/**
 * Conversation History Component
 * 显示特定 PDF 的对话历史
 */

"use client";

import React, { useState, useEffect } from "react";
import { Empty, Spin, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { usePDF } from "@/contexts/PDFContext";

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  tokens?: number;
  processingTime?: number;
}

interface ConversationHistoryData {
  pdfId: string;
  filename: string;
  pageCount: number | null;
  messages: ConversationMessage[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export function ConversationHistory() {
  const { activePdfId } = usePDF();
  const [history, setHistory] = useState<ConversationHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取对话历史
  useEffect(() => {
    if (!activePdfId) {
      setHistory(null);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ConversationHistory] 正在获取对话历史:', activePdfId);

        const response = await fetch(
          `/api/pdfs/${activePdfId}/conversations?limit=100&offset=0`
        );

        if (!response.ok) {
          throw new Error(`API 错误: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          console.log('[ConversationHistory] 获取到', data.data.messages.length, '条消息');
          setHistory(data.data);
        } else {
          console.warn('[ConversationHistory] API 返回异常:', data);
          setError('获取对话历史失败');
        }
      } catch (err) {
        console.error('[ConversationHistory] 获取对话历史出错:', err);
        setError(err instanceof Error ? err.message : '获取对话历史失败');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [activePdfId]);

  if (!activePdfId) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择一个 PDF"
        style={{ padding: '24px 0' }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={`错误: ${error}`}
        style={{ padding: '24px 0' }}
      />
    );
  }

  if (!history || history.messages.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无对话记录"
        style={{ padding: '24px 0' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>
            对话历史
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            共 {history.pagination.total} 条消息
          </div>
        </div>
        <Space size={8}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              // 重新加载
              window.location.reload();
            }}
          />
        </Space>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {history.messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 8,
              alignItems: 'flex-start'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: msg.role === 'user' ? '#6366F1' : '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0
            }}>
              {msg.role === 'user' ? '我' : 'AI'}
            </div>

            {/* Message */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{
                background: msg.role === 'user' ? '#F3F4F6' : '#F0FDF4',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                color: '#1E1B4B',
                lineHeight: 1.5,
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>

              {/* Metadata */}
              <div style={{
                display: 'flex',
                gap: 8,
                fontSize: 11,
                color: '#9CA3AF'
              }}>
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {msg.tokens && (
                  <>
                    <span>·</span>
                    <span>{msg.tokens} tokens</span>
                  </>
                )}
                {msg.processingTime && (
                  <>
                    <span>·</span>
                    <span>{(msg.processingTime / 1000).toFixed(1)}s</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      {history.pagination.total > 0 && (
        <div style={{
          padding: '12px',
          background: '#F9FAFB',
          borderRadius: 8,
          fontSize: 12,
          color: '#6B7280',
          borderTop: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>用户消息: {history.messages.filter(m => m.role === 'user').length}</span>
            <span>AI 回复: {history.messages.filter(m => m.role === 'assistant').length}</span>
            <span>总 Tokens: {history.messages.reduce((sum, m) => sum + (m.tokens || 0), 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
