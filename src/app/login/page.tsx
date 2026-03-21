/**
 * 用户登录页面 - Ant Design Modern
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message, Space, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setRegistered(true);
    }
  }, [searchParams]);

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      // 调用我们的登录 API（会检查用户是否被删除）
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 处理各种错误
        if (data.error === 'USER_DELETED') {
          message.error(data.message || '该账户已被删除或不存在');
        } else if (data.error === 'USER_SUSPENDED') {
          message.error(data.message || '该账户已被封禁');
        } else if (data.error === 'EMAIL_NOT_VERIFIED') {
          message.warning(data.message || '请先验证您的邮箱');
        } else {
          message.error(data.message || '邮箱或密码不正确');
        }
        return;
      }

      message.success('登录成功！');

      // 检查是否有重定向路径
      const redirectPath = searchParams.get('redirect');

      // 短暂延迟确保 session 已设置
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 跳转到目标页面或首页
      router.push(redirectPath || '/');
    } catch (err: any) {
      console.error('Login error:', err);
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* 注册成功提示 */}
        {registered && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 20, color: '#10B981', flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: '#065F46', margin: 0 }}>
              注册成功！请使用您的邮箱和密码登录
            </p>
          </div>
        )}

        {/* 登录卡片 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '32px 32px 24px',
              textAlign: 'center',
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: -3,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderRadius: 19,
                  filter: 'blur(12px)',
                  opacity: 0.4,
                }}
              />
              <span style={{ fontSize: 28, color: '#fff', fontWeight: 700, position: 'relative' }}>
                PDF
              </span>
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                marginBottom: 8,
              }}
            >
              欢迎回来
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              登录您的账户以继续使用 PDF AI Chat
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                name="email"
                label={
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>邮箱地址</span>
                }
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="your@email.com"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>密码</span>
                }
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="••••••••"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Form.Item name="rememberMe" valuePropName="checked" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" style={{ marginRight: 6 }} />
                    <span style={{ fontSize: 13, color: '#6B7280' }}>记住我（30天）</span>
                  </div>
                </Form.Item>
                <Link href="/forgot-password" style={{ fontSize: 13, color: '#6366F1' }}>
                  忘记密码？
                </Link>
              </div>

              <Form.Item noStyle style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  style={{
                    height: 46,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '24px 0 16px', fontSize: 13 }}>还没有账户？</Divider>

            <div style={{ textAlign: 'center' }}>
              <Link href="/register">
                <Button
                  size="large"
                  block
                  style={{
                    height: 46,
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    border: '2px solid #E5E7EB',
                  }}
                >
                  立即注册
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 返回首页 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#6B7280',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1E1B4B')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
          >
            <ArrowLeftOutlined style={{ fontSize: 14 }} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
