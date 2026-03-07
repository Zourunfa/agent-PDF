/**
 * Chat Message Component - Ant Design
 */

"use client";

import React, { useState } from "react";
import { Card, Avatar, Button, message as antdMessage } from "antd";
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
    antdMessage.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: 12,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start'
    }}>
      {/* Avatar */}
      <Avatar
        size={32}
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? '#6366F1' : '#F3F4F6',
          color: isUser ? '#fff' : '#6366F1',
          flexShrink: 0
        }}
      />

      {/* Message Content */}
      <div style={{ 
        flex: 1, 
        maxWidth: '80%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start'
      }}>
        <div style={{ 
          fontSize: 11, 
          color: '#9CA3AF', 
          marginBottom: 4,
          fontWeight: 500
        }}>
          {isUser ? '你' : 'AI 助手'}
        </div>
        
        <Card
          size="small"
          style={{
            backgroundColor: isUser ? '#6366F1' : '#F9FAFB',
            border: isUser ? 'none' : '1px solid #E5E7EB',
            borderRadius: 12,
            maxWidth: '100%'
          }}
          bodyStyle={{
            padding: '12px 16px',
            color: isUser ? '#fff' : '#1F2937'
          }}
        >
          {isUser ? (
            <div style={{ 
              fontSize: 13, 
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {content}
            </div>
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <MarkdownRenderer content={content} />
            </div>
          )}
        </Card>

        {/* Copy Button for AI messages */}
        {!isUser && content && (
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={{ 
              marginTop: 4,
              fontSize: 11,
              color: copied ? '#10B981' : '#9CA3AF'
            }}
          >
            {copied ? '已复制' : '复制'}
          </Button>
        )}
      </div>
    </div>
  );
}
