/**
 * App Layout - Ant Design
 */

"use client";

import React from "react";
import { Space, Divider } from "antd";
import { FileTextOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { PDFProvider } from "@/contexts/PDFContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { PDFList } from "@/components/pdf/PDFList";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFUploaderPro } from "@/components/pdf/PDFUploaderPro";
import { ChatInterface } from "@/components/chat/ChatInterface";

export function AppLayout() {
  return (
    <PDFProvider>
      <ChatProvider>
        <div style={{ 
          width: '100vw', 
          height: '100vh', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)'
        }}>
          {/* Header */}
          <div
            style={{
              height: 64,
              flexShrink: 0,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid #E5E7EB',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              zIndex: 10
            }}
          >
            <Space size={12}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <FileTextOutlined style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}>
                  PDF AI Chat
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.2 }}>智能文档分析</div>
              </div>
            </Space>
            
            <Space size={8} style={{ 
              padding: '6px 16px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              borderRadius: 20,
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <ThunderboltOutlined style={{ color: '#6366F1', fontSize: 14 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>AI 驱动</span>
            </Space>
          </div>

          {/* Main Content */}
          <div style={{ 
            flex: 1, 
            padding: 16, 
            overflow: 'hidden',
            display: 'flex',
            gap: 16
          }}>
            {/* Left Panel - PDF */}
            <div
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Upload */}
              <div style={{ padding: 16, flexShrink: 0 }}>
                <PDFUploaderPro />
              </div>

              <Divider style={{ margin: 0 }} />

              {/* PDF List */}
              <div style={{ padding: '12px 16px', maxHeight: 280, overflowY: 'auto', flexShrink: 0 }}>
                <PDFList />
              </div>

              <Divider style={{ margin: 0 }} />

              {/* PDF Viewer */}
              <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                <PDFViewer />
              </div>
            </div>

            {/* Right Panel - Chat */}
            <div
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <ChatInterface />
            </div>
          </div>
        </div>
      </ChatProvider>
    </PDFProvider>
  );
}
