/**
 * User Center Layout - Ant Design Modern
 * 用户中心侧边栏布局组件
 */

'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Layout, Menu, Avatar, Button, Space, Divider, theme } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/lib/auth/hooks';

const { Sider, Content } = Layout;

interface UserCenterLayoutProps {
  children: React.ReactNode;
}

export function UserCenterLayout({ children }: UserCenterLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/user-center/profile',
      icon: <UserOutlined />,
      label: <Link href="/user-center/profile">个人资料</Link>,
    },
    {
      key: '/user-center/change-password',
      icon: <LockOutlined />,
      label: <Link href="/user-center/change-password">修改密码</Link>,
    },
    {
      key: '/user-center/stats',
      icon: <BarChartOutlined />,
      label: <Link href="/user-center/stats">使用统计</Link>,
    },
  ];

  // 获取当前选中的菜单项
  const selectedKey = pathname;

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 24 }}>
          {/* 左侧边栏 */}
          <Sider
            width={280}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
              height: 'fit-content',
            }}
          >
            {/* 用户信息卡片 */}
            <div style={{ padding: 24, borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Avatar
                  size={80}
                  src={profile?.avatar_url}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    border: '3px solid #fff',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1E1B4B', marginBottom: 4 }}>
                    {profile?.name || user?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    {user?.email}
                  </div>
                </div>
                {profile?.email_verified ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', padding: '4px 12px', borderRadius: 20 }}>
                    <CheckCircleOutlined style={{ color: '#10B981', fontSize: 12 }} />
                    <span style={{ fontSize: 12, color: '#065F46', fontWeight: 500 }}>已验证</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF3C7', padding: '4px 12px', borderRadius: 20 }}>
                    <ClockCircleOutlined style={{ color: '#F59E0B', fontSize: 12 }} />
                    <span style={{ fontSize: 12, color: '#92400E', fontWeight: 500 }}>未验证</span>
                  </div>
                )}
              </div>
            </div>

            {/* 导航菜单 */}
            <div style={{ padding: '16px 0' }}>
              <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                }}
              />
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {/* 返回首页按钮 */}
            <div style={{ padding: '0 24px 24px' }}>
              <Link href="/">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  style={{ width: '100%', color: '#6B7280' }}
                >
                  返回首页
                </Button>
              </Link>
            </div>
          </Sider>

          {/* 右侧内容区域 */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
                minHeight: 600,
                overflow: 'hidden',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
