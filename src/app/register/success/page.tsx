/**
 * 注册成功 - 请验证邮箱页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, message } from 'antd';
import {
  MailOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

export default function RegisterSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('验证邮件已重新发送！');
      } else {
        message.error(data.message || '发送失败，请稍后重试');
      }
    } catch (error) {
      message.error('发送失败，请稍后重试');
    } finally {
      setResending(false);
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
      <div style={{ width: '100%', maxWidth: 480 }}>
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
              padding: '48px 32px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
              }}
            >
              <MailOutlined style={{ fontSize: 40, color: '#fff' }} />
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                marginBottom: 12,
              }}
            >
              注册成功！
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>
              我们已向您的邮箱发送了验证链接
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '0 32px 32px' }}>
            {email && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 24,
                }}
              >
                <p style={{ fontSize: 14, color: '#065F46', margin: 0, textAlign: 'center' }}>
                  验证邮件已发送至：
                  <strong style={{ marginLeft: 4 }}>{email}</strong>
                </p>
              </div>
            )}

            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: '#92400E',
                  margin: 0,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                ⚠️ 验证步骤
              </p>
              <ol style={{ fontSize: 13, color: '#92400E', margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 4 }}>检查您的邮箱收件箱</li>
                <li style={{ marginBottom: 4 }}>点击邮件中的验证链接</li>
                <li>验证完成后即可登录</li>
              </ol>
            </div>

            <div
              style={{
                background: '#F3F4F6',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: '#6B7280',
                  margin: 0,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                💡 没有收到邮件？
              </p>
              <ul style={{ fontSize: 13, color: '#6B7280', margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 4 }}>检查垃圾邮件文件夹</li>
                <li style={{ marginBottom: 4 }}>等待几分钟后再检查</li>
                <li>点击下方按钮重新发送</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                type="primary"
                icon={resending ? <LoadingOutlined /> : <MailOutlined />}
                loading={resending}
                onClick={handleResendEmail}
                size="large"
                block
                style={{
                  height: 46,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {resending ? '发送中...' : '重新发送验证邮件'}
              </Button>

              <Link href="/login">
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
                  前往登录
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
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: 14 }} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
