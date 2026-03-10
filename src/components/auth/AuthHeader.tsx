// 认证导航栏组件
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import { GuestQuotaIndicator } from './GuestQuotaIndicator';
import { Layout, Button, Dropdown, Space, Avatar, Spin, Tooltip } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;

export function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, isAuthenticated } = useAuth();

  // 在登录、注册、密码重置、邮箱验证页面不显示顶部栏
  const hideHeaderPaths = ['/login', '/register', '/reset-password', '/verify-email', '/forgot-password'];
  const shouldHideHeader = hideHeaderPaths.some(path => pathname.startsWith(path));

  if (shouldHideHeader) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => router.push('/user-center'),
    },
    ...(profile?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '管理后台',
            onClick: () => router.push('/admin'),
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* 左侧 - Logo 和标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/')}
        >
          PDF
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PDF AI Chat
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            智能文档分析助手
          </div>
        </div>
      </div>

      {/* 右侧 - 配额、登录/注册 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {loading ? (
          <Spin size="small" />
        ) : isAuthenticated ? (
          <>
            {/* 游客配额提示 */}
            {!user && <GuestQuotaIndicator />}

            {/* 用户菜单 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Tooltip title={profile?.name || user?.email}>
                  <Avatar
                    size={32}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      cursor: 'pointer',
                    }}
                  >
                    {profile?.name?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                  {profile?.name || user?.email?.split('@')[0]}
                </span>
              </div>
            </Dropdown>
          </>
        ) : (
          <>
            {/* 游客配额提示 */}
            <GuestQuotaIndicator />

            {/* 登录/注册按钮 */}
            <Space size={8}>
              <Button type="default" size="middle">
                <Link href="/login">登录</Link>
              </Button>
              <Button
                type="primary"
                size="middle"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderColor: 'transparent',
                }}
              >
                <Link href="/register">注册</Link>
              </Button>
            </Space>
          </>
        )}
      </div>
    </Header>
  );
}
