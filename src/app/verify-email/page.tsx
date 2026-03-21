// 邮箱验证页面
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Result, Spin, Space, Typography, Alert, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';

const { Text, Paragraph } = Typography;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (success === 'true') {
      setStatus('success');
      return;
    }

    if (error) {
      setStatus('error');
      switch (error) {
        case 'TOKEN_EXPIRED':
          setErrorMessage('验证链接已过期，请重新发送验证邮件');
          break;
        case 'INVALID_TOKEN':
          setErrorMessage('无效的验证链接');
          break;
        case 'missing_token':
          setErrorMessage('缺少验证令牌');
          break;
        default:
          setErrorMessage('验证失败，请稍后重试');
      }
      return;
    }

    // 如果有 token，自动验证
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setErrorMessage('缺少验证令牌');
    }
  }, [token, error, success]);

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');

        // 刷新认证状态（如果用户已登录）
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            // 用户已登录，刷新 session 以触发 auth state change
            await supabase.auth.refreshSession();
            message.success({
              content: '邮箱验证成功！您的账户信息已更新',
              duration: 3,
            });
          }
        } catch (err) {
          console.error('Failed to refresh auth state:', err);
        }
      } else {
        setStatus('error');
        if (data.error === 'TOKEN_EXPIRED') {
          setErrorMessage('验证链接已过期，请重新发送验证邮件');
        } else if (data.error === 'INVALID_TOKEN') {
          setErrorMessage('无效的验证链接');
        } else {
          setErrorMessage(data.message || '验证失败，请稍后重试');
        }
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // 这里可以添加重发验证邮件的逻辑
    // 需要用户登录才能重发
    router.push('/login?resend_verification=true');
  };

  if (loading || status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px'
      }}>
        <Card style={{ width: '100%', maxWidth: '480px', textAlign: 'center', borderRadius: '16px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px 0' }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 48, color: '#667eea' }} spin />}
            />
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>正在验证...</Typography.Title>
              <Text type="secondary">请稍候，我们正在验证您的邮箱</Text>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px'
      }}>
        <Card style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 72 }} />}
            title={<span style={{ fontSize: 28, fontWeight: 600 }}>邮箱验证成功</span>}
            subTitle="您的邮箱已成功验证，现在可以享受所有功能了"
            extra={[
              <Button
                key="login"
                type="primary"
                size="large"
                onClick={() => router.push('/login')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: '44px',
                  fontSize: '16px'
                }}
              >
                前往登录
              </Button>,
              <div key="home" style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link
                  href="/"
                  style={{
                    color: '#666',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}
                >
                  <ArrowLeftOutlined />
                  返回首页
                </Link>
              </div>,
            ]}
          >
            <Alert
              message={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>✓ 验证完成</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    您的邮箱已成功验证，现在可以使用您的账户登录并开始使用 PDF AI Chat。
                  </Text>
                </Space>
              }
              type="success"
              showIcon
              style={{ marginTop: '24px' }}
            />
          </Result>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px'
      }}>
        <Card style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Result
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 72 }} />}
            title={<span style={{ fontSize: 28, fontWeight: 600 }}>验证失败</span>}
            subTitle="邮箱验证失败，请稍后重试"
            extra={[
              <Space key="actions" direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  onClick={handleResend}
                  size="large"
                  block
                  icon={<ReloadOutlined />}
                >
                  重新发送验证邮件
                </Button>
                <Button
                  type="primary"
                  onClick={() => router.push('/login')}
                  size="large"
                  block
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: '44px',
                    fontSize: '16px'
                  }}
                >
                  返回登录
                </Button>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <Link
                    href="/"
                    style={{
                      color: '#666',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <ArrowLeftOutlined />
                    返回首页
                  </Link>
                </div>
              </Space>,
            ]}
          >
            <Alert
              message={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>验证失败</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {errorMessage}
                  </Text>
                </Space>
              }
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Alert
              message={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>💡 解决方案</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    您可以重新发送验证邮件，如果问题持续存在，请联系客服获取帮助。
                  </Text>
                </Space>
              }
              type="info"
              showIcon
            />
          </Result>
        </Card>
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: '#fff' }} spin />} />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
