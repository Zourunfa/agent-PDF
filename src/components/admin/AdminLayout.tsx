/**
 * Admin Layout - 管理后台布局组件
 * 支持页面滚动，覆盖全局固定布局
 */

'use client';

import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { usePageScrollable } from '@/hooks/usePageScrollable';

const { Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // 启用页面级滚动（带防御机制）
  usePageScrollable({
    enableDefense: true,
    defenseInterval: 1000,
    debug: process.env.NODE_ENV === 'development',
  });

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Content
        style={{
          padding: 24,
          background: 'transparent',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
}
