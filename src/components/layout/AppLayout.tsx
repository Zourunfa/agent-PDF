/**
 * App Layout - Ant Design Modern
 */

'use client';

import React from 'react';
import { Divider } from 'antd';
import { PDFProvider } from '@/contexts/PDFContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { PDFList } from '@/components/pdf/PDFList';
import { PDFPreview } from '@/components/pdf/PDFPreview';
import { PDFUploaderPro } from '@/components/pdf/PDFUploaderPro';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Inner component that uses hooks inside the providers
 */
function AppLayoutContent() {
  const { user } = useAuth();

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: 16,
          overflow: 'hidden',
          display: 'flex',
          gap: 16,
        }}
      >
        {/* Left Panel - PDF */}
        <div
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Upload */}
          <div style={{ padding: 16, flexShrink: 0 }}>
            <PDFUploaderPro />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* PDF List */}
          <div style={{ padding: '12px 16px', maxHeight: 240, overflowY: 'auto', flexShrink: 0 }}>
            <div
              style={{
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>文档列表</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>最近上传</span>
            </div>
            <PDFList />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* PDF Preview */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            <PDFPreview />
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <PDFProvider>
      <ChatProvider>
        <AppLayoutContent />
      </ChatProvider>
    </PDFProvider>
  );
}
