/**
 * 用户注册页面 - Ant Design Modern
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message, Space, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';

interface RegisterResponse {
  success: boolean;
  message: string;
  requireVerification?: boolean;
  emailSent?: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registerData, setRegisterData] = useState<RegisterResponse | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
        }),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      // 保存表单数据和注册响应
      setFormData({
        email: values.email,
        password: '',
        confirmPassword: '',
        name: values.name || '',
      });
      setRegisterData(data);
      setSuccess(true);

      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 3000);
    } catch (err: any) {
      message.error(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success && registerData) {
    const { emailSent, message } = registerData;

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
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.12)',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: emailSent ? '#DCFCE7' : '#FEF3C7',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircleOutlined
                style={{ fontSize: 40, color: emailSent ? '#10B981' : '#F59E0B' }}
              />
            </div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#1E1B4B',
                margin: 0,
                marginBottom: 12,
              }}
            >
              注册成功！
            </h2>

            {emailSent ? (
              <>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0, marginBottom: 8 }}>
                  我们已向{' '}
                  <span style={{ fontWeight: 600, color: '#1E1B4B' }}>{formData.email}</span>{' '}
                  发送了验证邮件
                </p>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, marginBottom: 4 }}>
                  请检查邮箱并点击验证链接激活账户
                </p>
                <div
                  style={{
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: 8,
                    padding: '12px',
                    marginTop: 16,
                  }}
                >
                  <p style={{ fontSize: 12, color: '#92400E', margin: 0, fontWeight: 500 }}>
                    💡 提示：如果未收到邮件，请检查垃圾邮件文件夹
                  </p>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0, marginBottom: 8 }}>
                  {message}
                </p>
                <div
                  style={{
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 8,
                    padding: '12px',
                    marginTop: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: '#991B1B',
                      margin: 0,
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    ⚠️ 邮件服务未配置
                  </p>
                  <p style={{ fontSize: 11, color: '#991B1B', margin: 0 }}>
                    请在用户中心重新发送验证邮件，或配置邮件服务
                  </p>
                </div>
              </>
            )}

            <p style={{ fontSize: 12, color: '#D1D5DB', margin: 0, paddingTop: 16 }}>
              页面将在 3 秒后自动跳转到登录页...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        {/* 注册卡片 */}
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
              创建账户
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              开始使用 PDF AI Chat，体验智能文档分析
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              initialValues={{ agreedToTerms: false }}
            >
              <Form.Item
                name="email"
                label={
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>
                    邮箱地址 <span style={{ color: '#EF4444' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="your@email.com"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="name"
                label={
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>
                    用户名（可选）
                  </span>
                }
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="您的名字"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>
                    密码 <span style={{ color: '#EF4444' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 8, message: '密码至少需要8位' },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: '密码必须包含字母和数字',
                  },
                ]}
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
                  fontSize: 11,
                  color: '#9CA3AF',
                  marginTop: -8,
                  marginBottom: 16,
                  marginLeft: 2,
                }}
              >
                至少8位，包含字母和数字
              </div>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                label={
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>
                    确认密码 <span style={{ color: '#EF4444' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="••••••••"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="agreedToTerms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('请阅读并同意服务条款和隐私政策')),
                  },
                ]}
                style={{ marginBottom: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <input type="checkbox" style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: '#6B7280' }}>
                    我同意{' '}
                    <Link href="/terms" style={{ color: '#6366F1', fontWeight: 500 }}>
                      服务条款
                    </Link>{' '}
                    和{' '}
                    <Link href="/privacy" style={{ color: '#6366F1', fontWeight: 500 }}>
                      隐私政策
                    </Link>
                  </span>
                </div>
              </Form.Item>

              <Form.Item noStyle>
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
                  {loading ? '注册中...' : '创建账户'}
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '24px 0 16px', fontSize: 13 }}>已有账户？</Divider>

            <div style={{ textAlign: 'center' }}>
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
                  立即登录
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 返回首页 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, margin: 0 }}>
            不想注册？{' '}
            <Link href="/" style={{ fontSize: 13, color: '#6366F1', fontWeight: 500 }}>
              继续免费试用（3次）
            </Link>
          </p>
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
