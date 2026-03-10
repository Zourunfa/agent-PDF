/**
 * App Layout - Ant Design Modern
 */

"use client";

import React, { useState, useEffect } from "react";
import { Space, Divider, Tabs, Badge } from "antd";
import { UserOutlined, LoginOutlined } from "@ant-design/icons";
import { PDFProvider } from "@/contexts/PDFContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { PDFList } from "@/components/pdf/PDFList";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFPreview } from "@/components/pdf/PDFPreview";
import { PDFUploaderPro } from "@/components/pdf/PDFUploaderPro";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";

interface QuotaStats {
  upload: {
    allowed: boolean;
    quotaLimit: number;
    used: number;
    remaining: number;
  };
  chat: {
    allowed: boolean;
    quotaLimit: number;
    used: number;
    remaining: number;
  };
}

export function AppLayout() {
  const { user } = useAuth();
  const [quotaStats, setQuotaStats] = useState<QuotaStats | null>(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/quota/stats');
        const data = await response.json();
        if (data.success) {
          setQuotaStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error);
      }
    };

    fetchQuota();
  }, []);

  const tabItems = [
    {
      key: 'preview',
      label: 'PDF 预览',
      children: <PDFPreview />,
    },
    {
      key: 'text',
      label: '文本内容',
      children: <PDFViewer />,
    },
  ];

  return (
    <PDFProvider>
      <ChatProvider>
        <div style={{
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)'
        }}>
          {/* Main Content */}
          <div style={{
            flex: 1,
            padding: 16,
            paddingBottom: 72,
            overflow: 'hidden',
            display: 'flex',
            gap: 16
          }}>
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
                overflow: 'hidden'
              }}
            >
              {/* Upload */}
              <div style={{ padding: 16, flexShrink: 0 }}>
                <PDFUploaderPro />
              </div>

              <Divider style={{ margin: 0 }} />

              {/* PDF List */}
              <div style={{ padding: '12px 16px', maxHeight: 240, overflowY: 'auto', flexShrink: 0 }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>文档列表</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>最近上传</span>
                </div>
                <PDFList />
              </div>

              <Divider style={{ margin: 0 }} />

              {/* PDF Viewer */}
              <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                <Tabs
                  defaultActiveKey="preview"
                  items={tabItems}
                  style={{ height: '100%' }}
                  tabBarStyle={{ marginBottom: 12, fontSize: 13, fontWeight: 600 }}
                />
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
                flexDirection: 'column'
              }}
            >
              <ChatInterface />
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: 64,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid #E5E7EB',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 -2px 8px rgba(99, 102, 241, 0.08)',
              zIndex: 10
            }}
          >
            {/* Left Side - Logo & Quota */}
            <Space size={20}>
              {/* Logo */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: -2,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderRadius: 12,
                  filter: 'blur(8px)',
                  opacity: 0.4
                }} />
                <span style={{ fontSize: 18, color: '#fff', position: 'relative', fontWeight: 700 }}>
                  PDF
                </span>
              </div>

              {/* Title & Quota */}
              <div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}>
                  PDF AI Chat
                </div>

                {/* Quota Display */}
                {quotaStats ? (
                  <div style={{ marginTop: 2 }}>
                    <Space size={12}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        剩余
                        <Badge
                          count={quotaStats.chat.remaining}
                          style={{
                            backgroundColor: quotaStats.chat.remaining === 0 ? '#EF4444' : '#6366F1',
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '0 5px',
                            height: 16,
                            lineHeight: '16px',
                            marginLeft: 4
                          }}
                        />
                        <span style={{ marginLeft: 4 }}>次免费体验</span>
                      </span>
                    </Space>
                  </div>
                ) : (
                  <div style={{ marginTop: 2, fontSize: 10, color: '#9CA3AF' }}>
                    智能文档分析助手
                  </div>
                )}
              </div>
            </Space>

            {/* Right Side - Auth Buttons */}
            <Space size={8}>
              {user ? (
                <Space size={8} style={{
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  borderRadius: 20,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <UserOutlined style={{ color: '#6366F1', fontSize: 14 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6366F1' }}>
                    {user.email}
                  </span>
                </Space>
              ) : (
                <>
                  <a href="/login">
                    <Space size={6} style={{
                      padding: '8px 18px',
                      background: 'transparent',
                      borderRadius: 8,
                      border: '1px solid #D1D5DB',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#6B7280'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6366F1';
                      e.currentTarget.style.color = '#6366F1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.color = '#6B7280';
                    }}
                    >
                      <LoginOutlined style={{ fontSize: 13 }} />
                      <span>登录</span>
                    </Space>
                  </a>
                  <a href="/register">
                    <Space size={6} style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    >
                      <span>注册</span>
                    </Space>
                  </a>
                </>
              )}
            </Space>
          </div>
        </div>
      </ChatProvider>
    </PDFProvider>
  );
}
