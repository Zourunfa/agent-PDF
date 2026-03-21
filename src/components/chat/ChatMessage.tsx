/**
 * Chat Message Component - Ant Design Modern
 */

"use client";

import React, { useState } from "react";
import { Card, Avatar, Button, message, Space } from "antd";
import { UserOutlined, RobotOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { MessageRole } from "@/types/chat";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === MessageRole.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    message.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '75%' }}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: 16,
              borderTopRightRadius: 4,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: '#fff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {content}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: '75%' }}>
        <Space direction="vertical" size={4}>
          <Card
            style={{
              background: '#fff',
              border: '1px solid #F0F0F0',
              borderRadius: 16,
              borderTopLeftRadius: 4,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <MarkdownRenderer content={content} />
            </div>
          </Card>
          {content && (
            <Button
              type="text"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              style={{
                fontSize: 11,
                color: copied ? '#10B981' : '#9CA3AF',
                height: 24,
                padding: '0 8px'
              }}
            >
              {copied ? '已复制' : '复制'}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
