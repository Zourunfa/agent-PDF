/**
 * Chat Interface - Ant Design Modern
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Empty, Space, Card, Tag, message, Spin } from 'antd';
import {
  SendOutlined,
  ClearOutlined,
  MessageOutlined,
  BulbOutlined,
  UserOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useChat } from '@/contexts/ChatContext';
import { usePDF } from '@/contexts/PDFContext';
import { createUserMessage, createAssistantMessage } from '@/lib/chat/conversation';
import { MessageRole } from '@/types/chat';
import { ParseStatus } from '@/types/pdf';
import { ChatMessage } from './ChatMessage';

const { TextArea } = Input;

export function ChatInterface() {
  const { activePdfId, pdfs } = usePDF();
  const {
    conversations,
    activeConversationId,
    isStreaming,
    addMessage,
    loadMessages,
    setActiveConversation,
    setStreaming,
    clearConversation,
  } = useChat();

  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<
    Array<{
      id: string;
      role: MessageRole;
      content: string;
    }>
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeConversationId ? conversations.get(activeConversationId) || [] : [];
  const conversationId = activePdfId ? `conv-${activePdfId}` : null;

  const activePdf = activePdfId ? pdfs.get(activePdfId) : null;
  const isParsing = activePdf?.parseStatus === ParseStatus.PARSING;
  const isFailed = activePdf?.parseStatus === ParseStatus.FAILED;
  const isDisabled = isStreaming || isParsing || isFailed;

  // 加载历史对话
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activePdfId) {
        if (conversationId) {
          loadMessages(conversationId, []);
        }
        return;
      }

      try {
        setLoadingHistory(true);
        console.log('[ChatInterface] 正在加载历史对话:', activePdfId);

        const response = await fetch(`/api/pdfs/${activePdfId}/conversations?limit=100&offset=0`);

        if (!response.ok) {
          throw new Error(`API 错误: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data.messages) {
          console.log('[ChatInterface] 加载到', data.data.messages.length, '条历史消息');

          // 转换消息格式
          const historyMessages = data.data.messages.map((msg: any) => ({
            id: msg.id,
            conversationId: `conv-${activePdfId}`,
            pdfId: activePdfId,
            role: msg.role === 'user' ? MessageRole.USER : MessageRole.ASSISTANT,
            content: msg.content,
            createdAt: msg.createdAt,
            tokens: msg.tokens,
            processingTime: msg.processingTime,
          }));

          loadMessages(conversationId!, historyMessages);
        } else {
          // 没有历史记录，清空对话
          loadMessages(conversationId!, []);
        }
      } catch (err) {
        console.error('[ChatInterface] 加载历史对话失败:', err);
        // 出错时也清空对话
        loadMessages(conversationId!, []);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activePdfId]);

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localMessages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !activePdfId || isDisabled) return;

    const userMessage = createUserMessage(conversationId!, activePdfId, input);
    const userInput = input;

    setInput('');
    setStreaming(true);
    addMessage(conversationId!, userMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfId: activePdfId,
          question: userInput,
          conversationId: conversationId!,
          history: messages,
          pdfTextContent: activePdf?.textContent || undefined,
          pdfPageCount: activePdf?.pageCount || undefined,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      const tempAssistantId = `temp-${Date.now()}`;
      setLocalMessages([{ id: tempAssistantId, role: MessageRole.ASSISTANT, content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'token') {
                  assistantMessage += data.content || '';
                  setLocalMessages([
                    { id: tempAssistantId, role: MessageRole.ASSISTANT, content: assistantMessage },
                  ]);
                } else if (data.type === 'end') {
                  const aiMessage = createAssistantMessage(
                    conversationId!,
                    activePdfId,
                    assistantMessage,
                    data.metadata
                  );
                  addMessage(conversationId!, aiMessage);
                  setLocalMessages([]);
                } else if (data.type === 'error') {
                  const errorCode = data.error?.code;
                  const errorMessage = data.error?.message || '未知错误';

                  if (errorCode === 'AI_NOT_CONFIGURED') {
                    assistantMessage = `⚠️ **AI服务未配置**

请配置以下环境变量之一：
- \`ALIBABA_API_KEY\` - 通义千问API密钥
- \`QWEN_API_KEY\` - 千问API密钥

配置方法：
1. 创建 \`.env.local\` 文件
2. 添加：\`ALIBABA_API_KEY=your_api_key_here\`
3. 重启开发服务器

获取API密钥：https://dashscope.aliyun.com`;
                  } else {
                    assistantMessage = `❌ **错误**\n\n${errorMessage}`;
                  }
                  setLocalMessages([
                    { id: tempAssistantId, role: MessageRole.ASSISTANT, content: assistantMessage },
                  ]);
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setLocalMessages([
        {
          id: `error-${Date.now()}`,
          role: MessageRole.ASSISTANT,
          content: '抱歉，发生错误，请重试。',
        },
      ]);
    } finally {
      setStreaming(false);
      setTimeout(() => setLocalMessages([]), 100);
    }
  }, [
    input,
    activePdfId,
    isDisabled,
    conversationId,
    messages,
    addMessage,
    setStreaming,
    activePdf,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    if (conversationId) {
      clearConversation(conversationId);
      setLocalMessages([]);
    }
  };

  if (!activePdfId) {
    return (
      <div
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Empty
          image={<MessageOutlined style={{ fontSize: 64, color: '#D1D5DB' }} />}
          description={
            <Space direction="vertical" size={4}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>开始智能对话</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>上传并选择 PDF 文档</span>
            </Space>
          }
        />
      </div>
    );
  }

  const displayMessages = [...messages, ...localMessages];
  const exampleQuestions = [
    '详细分析下文档？',
    '帮我总结一下关键要点',
    '文档中提到了哪些重要数据？',
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <Space size={10}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
            }}
          >
            <BulbOutlined style={{ fontSize: 16, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>AI 对话助手</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>基于文档内容的智能问答</div>
          </div>
        </Space>
        {displayMessages.length > 0 && (
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClear}
            style={{ borderRadius: 8 }}
          >
            清空对话
          </Button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {loadingHistory ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Space direction="vertical" align="center" size={16}>
              <Spin size="large" />
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>加载历史对话中...</span>
            </Space>
          </div>
        ) : displayMessages.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Space direction="vertical" align="center" size={20} style={{ maxWidth: 400 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  background:
                    'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: -4,
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    borderRadius: 24,
                    filter: 'blur(16px)',
                    opacity: 0.3,
                  }}
                />
                <BulbOutlined style={{ fontSize: 36, color: '#6366F1', position: 'relative' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1E1B4B', marginBottom: 6 }}>
                  开始提问
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  询问关于文档的任何问题，AI 将为您提供详细的解答
                </div>
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {exampleQuestions.map((q, i) => (
                  <Card
                    key={i}
                    size="small"
                    hoverable
                    onClick={() => setInput(q)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      border: '1px solid #F0F0F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s',
                    }}
                    bodyStyle={{ padding: '12px 16px' }}
                  >
                    <div style={{ fontSize: 13, color: '#4B5563' }}>{q}</div>
                  </Card>
                ))}
              </Space>
            </Space>
          </div>
        ) : (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {displayMessages.map((msg, idx) => (
                <div key={msg.id || `local-${idx}`}>
                  <ChatMessage role={msg.role} content={msg.content} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </Space>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: 20,
          borderTop: '1px solid #F0F0F0',
          background: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        {isFailed && (
          <Card
            size="small"
            style={{
              marginBottom: 12,
              background: '#FEF2F2',
              borderColor: '#FCA5A5',
              borderRadius: 12,
            }}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>⚠️ PDF 解析失败</div>
              <div style={{ fontSize: 12, color: '#991B1B' }}>
                无法自动提取文档内容。请在左侧 PDF
                列表中点击"手动输入"按钮，粘贴文档文本后即可开始对话。
              </div>
            </Space>
          </Card>
        )}
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isFailed
                ? '请先手动输入文档内容...'
                : isParsing
                  ? '文档解析中，请稍候...'
                  : '输入您的问题...'
            }
            disabled={isDisabled}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              resize: 'none',
              borderRadius: '12px 0 0 12px',
              fontSize: 14,
              padding: '12px 16px',
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            disabled={!input.trim() || isDisabled}
            loading={isStreaming}
            style={{
              borderRadius: '0 12px 12px 0',
              height: 'auto',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            发送
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 10, fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
          {isParsing ? (
            <span style={{ color: '#F59E0B', fontWeight: 500 }}>⏳ 文档解析中...</span>
          ) : isFailed ? (
            <span style={{ color: '#DC2626', fontWeight: 500 }}>
              ❌ 解析失败，请手动输入文档内容
            </span>
          ) : (
            <>
              <Tag style={{ fontSize: 10, borderRadius: 4, padding: '2px 6px' }}>Enter</Tag> 发送
              <span style={{ margin: '0 8px' }}>·</span>
              <Tag style={{ fontSize: 10, borderRadius: 4, padding: '2px 6px' }}>
                Shift + Enter
              </Tag>{' '}
              换行
            </>
          )}
        </div>
      </div>
    </div>
  );
}
