/**
 * Admin Login Page
 * 管理员登录页面
 */

'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, SettingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface AdminLoginData {
  username: string;
  password: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // 如果已登录，跳转到管理页面
  React.useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      router.push('/admin/users');
    }
  }, [router]);

  const onFinish = async (values: AdminLoginData) => {
    try {
      setLoading(true);
      console.log('[Admin Login] 登录中...');

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        const token = data.data.token;
        localStorage.setItem('adminToken', token);
        message.success('登录成功！');
        router.push('/admin/users');
      } else {
        message.error(data.error?.message || '登录失败');
      }
    } catch (error) {
      console.error('[Admin Login] Error:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (adminToken) {
    return null; // 会跳转
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SettingOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0, color: '#1E1B4B' }}>
            管理员登录
          </Title>
          <Text type="secondary">请输入管理员凭证</Text>
        </div>

        <Form name="adminLogin" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                borderRadius: 8,
                height: 44,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type="link" onClick={() => router.push('/')} style={{ color: '#667eea' }}>
            返回首页
          </Button>
        </div>
      </Card>
    </div>
  );
}
