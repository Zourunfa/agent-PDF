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
  const [emailSent, setEmailSent] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const emailSentParam = searchParams.get('emailSent');
    const devModeParam = searchParams.get('devMode');

    if (emailParam) {
      setEmail(emailParam);
    }
    if (emailSentParam !== null) {
      setEmailSent(emailSentParam === 'true');
    }
    if (devModeParam !== null) {
      setDevMode(devModeParam === 'true');
    }

    // 页面加载时显示状态提示
    if (emailSentParam === 'false' && devModeParam !== 'true') {
      // 邮件发送失败，显示错误提示
      message.error({
        content: '邮件发送失败！请检查网络连接或稍后重新发送验证邮件',
        duration: 8,
        key: 'email-send-failed',
      });
    } else if (devModeParam === 'true') {
      // 开发模式，显示警告
      message.warning({
        content: '开发模式：邮件已跳过，但仍需验证邮箱后才能登录',
        duration: 6,
        key: 'dev-mode-skip',
      });
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
        // 发送成功
        message.success({
          content: '✅ 验证邮件已重新发送！请检查您的邮箱',
          duration: 5,
        });
        setEmailSent(true);
        setDevMode(false);
      } else {
        // 发送失败
        const errorMsg = data.message || '发送失败，请稍后重试';

        // 检查是否是开发模式
        if (data.developmentMode) {
          message.warning({
            content: '开发模式：邮件已跳过，但您仍需验证邮箱',
            duration: 5,
          });
          setDevMode(true);
        } else {
          message.error({
            content: `❌ ${errorMsg}`,
            duration: 6,
          });
        }
      }
    } catch (error) {
      console.error('重发邮件失败:', error);
      message.error({
        content: '❌ 网络错误，请检查连接后重试',
        duration: 6,
      });
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
        paddingTop: (!emailSent && !devMode) || (devMode && !emailSent) ? '80px' : '24px',
        paddingBottom: '24px',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>

      {/* 邮件发送失败警告横幅 */}
      {!emailSent && !devMode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            padding: '16px 24px',
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>⚠️ 邮件发送失败！请检查网络连接后点击下方按钮重新发送验证邮件</span>
          </div>
        </div>
      )}

      {/* 开发模式提示横幅 */}
      {devMode && !emailSent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            padding: '16px 24px',
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>💻</span>
            <span>开发模式：邮件已跳过，请点击下方按钮发送验证邮件</span>
          </div>
        </div>
      )}
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
                background: emailSent
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : devMode
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: emailSent
                  ? '0 4px 16px rgba(16, 185, 129, 0.3)'
                  : '0 4px 16px rgba(239, 68, 68, 0.3)',
              }}
            >
              {emailSent ? (
                <MailOutlined style={{ fontSize: 40, color: '#fff' }} />
              ) : (
                <CheckCircleOutlined style={{ fontSize: 40, color: '#fff' }} />
              )}
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                background: emailSent
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : devMode
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                marginBottom: 12,
              }}
            >
              注册成功！
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>
              {emailSent
                ? '我们已向您的邮箱发送了验证链接'
                : devMode
                  ? '开发模式：邮件已跳过，但仍需验证邮箱'
                  : '邮件发送失败，请稍后重新发送'}
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '0 32px 32px' }}>
            {email && (
              <div
                style={{
                  background: emailSent
                    ? '#F0FDF4'
                    : devMode
                      ? '#FEF3C7'
                      : '#FEE2E2',
                  border: emailSent
                    ? '1px solid #86EFAC'
                    : devMode
                      ? '1px solid #FCD34D'
                      : '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 24,
                }}
              >
                <p style={{
                  fontSize: 14,
                  color: emailSent
                    ? '#065F46'
                    : devMode
                      ? '#92400E'
                      : '#991B1B',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  {emailSent
                    ? '验证邮件已发送至：'
                    : devMode
                      ? '开发模式 - 邮箱：'
                      : '邮件发送失败 - 邮箱：'}
                  <strong style={{ marginLeft: 4 }}>{email}</strong>
                </p>
              </div>
            )}

            {emailSent && (
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
            )}

            {devMode && !emailSent && (
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
                  💻 开发模式
                </p>
                <ul style={{ fontSize: 13, color: '#92400E', margin: 0, paddingLeft: 20 }}>
                  <li style={{ marginBottom: 4 }}>邮件发送已跳过（开发环境）</li>
                  <li style={{ marginBottom: 4 }}>您仍需验证邮箱才能登录</li>
                  <li>请点击下方按钮发送验证邮件</li>
                </ul>
              </div>
            )}

            {!emailSent && !devMode && (
              <div
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 24,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: '#991B1B',
                    margin: 0,
                    fontWeight: 500,
                    marginBottom: 8,
                  }}
                >
                  ⚠️ 邮件发送失败
                </p>
                <ul style={{ fontSize: 13, color: '#991B1B', margin: 0, paddingLeft: 20 }}>
                  <li style={{ marginBottom: 4 }}>网络连接异常或SMTP配置错误</li>
                  <li style={{ marginBottom: 4 }}>请检查网络连接后重试</li>
                  <li>或点击下方按钮重新发送</li>
                </ul>
              </div>
            )}

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
                {!emailSent
                  ? '📧 重新发送验证邮件'
                  : '💡 没有收到邮件？'}
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
                  height: !emailSent && !devMode ? 54 : 46,
                  borderRadius: 12,
                  background: !emailSent && !devMode
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                    : emailSent
                      ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                      : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  border: 'none',
                  fontSize: !emailSent && !devMode ? 16 : 15,
                  fontWeight: 600,
                  boxShadow: !emailSent && !devMode
                    ? '0 8px 20px rgba(239, 68, 68, 0.4)'
                    : '0 4px 12px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.3s ease',
                  animation: !emailSent && !devMode ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              >
                {resending ? '发送中...' : emailSent ? '重新发送验证邮件' : '📧 发送验证邮件'}
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
