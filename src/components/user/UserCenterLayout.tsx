/**
 * User Center Layout - Ant Design Modern
 * 用户中心侧边栏布局组件
 * 支持响应式布局（移动端/桌面端）
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Layout, Menu, Avatar, Button, Space, Divider, theme, Drawer } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MenuOutlined,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    {
      key: '/user-center/profile',
      icon: <UserOutlined />,
      label: (
        <Link href="/user-center/profile" onClick={() => setMobileMenuOpen(false)}>
          个人资料
        </Link>
      ),
    },
    {
      key: '/user-center/change-password',
      icon: <LockOutlined />,
      label: (
        <Link href="/user-center/change-password" onClick={() => setMobileMenuOpen(false)}>
          修改密码
        </Link>
      ),
    },
    {
      key: '/user-center/stats',
      icon: <BarChartOutlined />,
      label: (
        <Link href="/user-center/stats" onClick={() => setMobileMenuOpen(false)}>
          使用统计
        </Link>
      ),
    },
  ];

  // 获取当前选中的菜单项
  const selectedKey = pathname;

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 移动端菜单内容
  const mobileMenuContent = (
    <div style={{ width: 280 }}>
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
            <div style={{ fontSize: 13, color: '#6B7280' }}>{user?.email}</div>
          </div>
          {profile?.email_verified ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#F0FDF4',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              <CheckCircleOutlined style={{ color: '#10B981', fontSize: 12 }} />
              <span style={{ fontSize: 12, color: '#065F46', fontWeight: 500 }}>已验证</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#FEF3C7',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
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
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            style={{ width: '100%', color: '#6B7280' }}
          >
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <Layout
      style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      }}
    >
      <Content style={{ padding: isMobile ? '16px' : '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 移动端菜单按钮 */}
          {isMobile && (
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  border: 'none',
                  borderRadius: 12,
                  height: 44,
                  paddingLeft: 20,
                  paddingRight: 20,
                  fontSize: 15,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                菜单
              </Button>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: isMobile ? 0 : 24,
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            {/* 桌面端左侧边栏 */}
            {!isMobile && (
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
                {mobileMenuContent}
              </Sider>
            )}

            {/* 右侧内容区域 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: isMobile ? 12 : 16,
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
                  minHeight: isMobile ? 400 : 600,
                  overflow: 'hidden',
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </Content>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title={null}
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        closable={false}
        width={280}
        styles={{
          body: { padding: 0 },
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {mobileMenuContent}
      </Drawer>
    </Layout>
  );
}
