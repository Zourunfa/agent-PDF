// 认证导航栏组件
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import { GuestQuotaIndicator } from './GuestQuotaIndicator';
import { Layout, Button, Dropdown, Space, Avatar, Spin, Tooltip, Divider } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, HomeOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;

export function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, isAuthenticated } = useAuth();

  // 检测登录状态变化：如果当前没有加载完且已登录，自动刷新
  useEffect(() => {
    if (loading === false && isAuthenticated === false) {
      // 检查是否有 Supabase session 但还没有获取到用户信息
      const checkSession = async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          // 如果有 session 但 useAuth 还没获取到，触发刷新
          if (session?.user && !user) {
            console.log('[AuthHeader] Detected session but no user data, refreshing...');
            // 温和刷新
            window.location.reload();
          }
        } catch (error) {
          console.error('[AuthHeader] Error checking session:', error);
        }
      };

      // 延迟检查，确保 hook 已经尝试获取
      const timeoutId = setTimeout(checkSession, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [loading, isAuthenticated, user]);

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
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => router.push('/'),
    },
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
        background: 'linear-gradient(90deg, #ffffff 0%, #fafbfc 100%)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(99, 102, 241, 0.06)',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
      }}
    >
      {/* 左侧 - Logo 和标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onClick={() => router.push('/')}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {/* Logo */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 800,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
            flexShrink: 0,
          }}
        >
          PDF
        </div>

        {/* 标题和描述 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            PDF AI Chat
          </div>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 500, letterSpacing: '0.3px' }}>
            智能文档分析助手
          </div>
        </div>
      </div>

      {/* 右侧 - 配额、登录/注册 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {loading ? (
          <Spin size="small" />
        ) : isAuthenticated ? (
          <>
            {/* 游客配额提示 */}
            {!user && <GuestQuotaIndicator />}

            {/* 分割线 */}
            <Divider type="vertical" style={{ height: 24, margin: 0 }} />

            {/* 用户菜单 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <Tooltip title={profile?.name || user?.email}>
                  <Avatar
                    size={36}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {profile?.name?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333', minWidth: 80 }}>
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
            <Space size={10}>
              <Button
                type="text"
                size="middle"
                style={{
                  color: '#666',
                  fontWeight: 500,
                  borderRadius: 6,
                }}
              >
                <Link href="/login">登录</Link>
              </Button>
              <Button
                type="primary"
                size="middle"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderColor: 'transparent',
                  fontWeight: 600,
                  borderRadius: 6,
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
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
