'use client';

/**
 * User Center Main Page
 *
 * 用户中心主页
 */

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePageScrollable } from '@/hooks/usePageScrollable';
import { QuotaDisplay } from '@/components/quota/QuotaDisplay';
import {
  Layout,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Space,
  Divider,
  Alert,
  Spin,
  Statistic,
  Badge,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LockOutlined,
  CrownOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Content } = Layout;

export default function UserCenterPage() {
  const { user, profile, loading, isPremium } = useAuth();
  const router = useRouter();

  // Enable page scrolling
  usePageScrollable({
    enableDefense: true,
    defenseInterval: 1000,
    debug: process.env.NODE_ENV === 'development',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      user: '免费用户',
      premium: '高级用户',
      admin: '管理员',
    };
    return roles[role] || '未知';
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      user: 'default',
      premium: 'purple',
      admin: 'red',
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'premium' || role === 'admin') {
      return <CrownOutlined />;
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <Content style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 页面标题 */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, marginBottom: 8 }}>
              用户中心
            </h1>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
              管理您的账户信息和偏好设置
            </p>
          </div>

          {/* 升级提示（仅免费用户显示） */}
          {!isPremium && (
            <Alert
              message="升级到高级版"
              description="解锁更多配额和高级功能，享受更流畅的体验。"
              type="info"
              icon={<CrownOutlined />}
              showIcon
              style={{ marginBottom: 24 }}
              action={
                <Button size="small" type="primary">
                  <Link href="/pricing">查看详情</Link>
                </Button>
              }
            />
          )}

          {/* 用户基本信息卡片 */}
          <Card
            style={{ marginBottom: 32 }}
            bodyStyle={{ padding: 32 }}
          >
            <Row gutter={[32, 32]} align="middle">
              {/* 头像 */}
              <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                <Badge
                  count={profile.emailVerified ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} /> : null}
                  offset={[-10, 10]}
                >
                  <Avatar
                    size={120}
                    icon={<UserOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      fontSize: 48,
                    }}
                  >
                    {profile.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
              </Col>

              {/* 用户信息 */}
              <Col xs={24} sm={18}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>
                    {profile.name || '未设置姓名'}
                  </h2>
                  <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
                    {user.email}
                  </p>
                </div>

                <Space size="large" wrap style={{ marginBottom: 16 }}>
                  <Tag
                    icon={getRoleIcon(profile.role)}
                    color={getRoleColor(profile.role)}
                  >
                    {getRoleLabel(profile.role)}
                  </Tag>
                  {profile.emailVerified ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      邮箱已验证
                    </Tag>
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      邮箱未验证
                    </Tag>
                  )}
                </Space>

                <Divider style={{ margin: '16px 0' }} />

                <Space>
                  <span style={{ fontSize: 13, color: '#999' }}>注册时间：</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {new Date(profile.createdAt || user.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 配额显示 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>今日配额</h3>
            <QuotaDisplay />
          </div>

          {/* 功能模块卡片 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>快速操作</h3>
            <Row gutter={[16, 16]}>
              {/* 个人资料 */}
              <Col xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  onClick={() => router.push('/user-center/profile')}
                  style={{ cursor: 'pointer', height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: '#E6F7FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      <UserOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: 4, fontSize: 16, fontWeight: 600 }}>
                        个人资料
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                        编辑您的个人信息
                      </p>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <ArrowRightOutlined style={{ color: '#1890ff' }} />
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* 使用统计 */}
              <Col xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  onClick={() => router.push('/user-center/stats')}
                  style={{ cursor: 'pointer', height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: '#F6FFED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      <BarChartOutlined style={{ color: '#52c41a' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: 4, fontSize: 16, fontWeight: 600 }}>
                        使用统计
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                        查看您的使用情况
                      </p>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <ArrowRightOutlined style={{ color: '#52c41a' }} />
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* 修改密码 */}
              <Col xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  onClick={() => router.push('/user-center/change-password')}
                  style={{ cursor: 'pointer', height: '100%' }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: '#F9F0FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      <LockOutlined style={{ color: '#722ed1' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: 4, fontSize: 16, fontWeight: 600 }}>
                        修改密码
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                        更新您的账户密码
                      </p>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <ArrowRightOutlined style={{ color: '#722ed1' }} />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>

          {/* 温馨提示 */}
          <Alert
            message="温馨提示"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>定期更换密码以保护账户安全</li>
                <li>完成邮箱验证以解锁全部功能</li>
                <li>上传的 PDF 文档会自动保存，随时可以继续对话</li>
              </ul>
            }
            type="info"
            icon={<FileTextOutlined />}
            showIcon
          />
        </div>
      </Content>
    </Layout>
  );
}
