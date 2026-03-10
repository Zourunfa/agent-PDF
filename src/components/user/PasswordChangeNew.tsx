/**
 * Password Change Component - Ant Design Modern
 * 密码修改组件
 */

'use client';

import React, { useState } from 'react';
import { Form, Input, Button, message, Alert, Space, Progress } from 'antd';
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/utils/api-fetch';

export function PasswordChange() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);

  // 计算密码强度
  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 30) return '#FF4D4F';
    if (score < 60) return '#FAAD14';
    if (score < 80) return '#1890FF';
    return '#52C41A';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 30) return '弱';
    if (score < 60) return '一般';
    if (score < 80) return '良好';
    return '强';
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    setLoading(true);

    try {
      const data = await apiPost('/api/user/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (!data.success) {
        throw new Error(data.message || '密码修改失败');
      }

      message.success('密码修改成功！请重新登录');

      // 延迟2秒后跳转到登录页
      setTimeout(() => {
        // 登出用户
        fetch('/api/auth/logout', { method: 'POST' }).then(() => {
          router.push('/login');
        });
      }, 2000);
    } catch (err: any) {
      message.error(err.message || '密码修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8, color: '#1E1B4B' }}>
          修改密码
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>为了账户安全，建议定期更换密码</p>
      </div>

      {/* 安全提示 */}
      <Alert
        message="密码要求"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>至少 8 个字符</li>
            <li>必须包含字母和数字</li>
            <li>不能与当前密码相同</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 密码修改表单 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleChangePassword}
        requiredMark={false}
        style={{ maxWidth: 480 }}
      >
        <Form.Item
          name="currentPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入当前密码"
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码至少需要 8 位' },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
              message: '密码必须包含字母和数字',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码"
            size="large"
            style={{ borderRadius: 8 }}
            onChange={(e) => {
              const password = e.target.value;
              setStrength(calculateStrength(password));
            }}
          />
        </Form.Item>

        {/* 密码强度指示器 */}
        {strength > 0 && (
          <div style={{ marginTop: -12, marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, color: '#6B7280' }}>密码强度</span>
              <span
                style={{ fontSize: 12, color: getPasswordStrengthColor(strength), fontWeight: 500 }}
              >
                {getPasswordStrengthText(strength)}
              </span>
            </div>
            <Progress
              percent={strength}
              strokeColor={getPasswordStrengthColor(strength)}
              showInfo={false}
              size="small"
            />
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入新密码"
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            style={{ height: 44, borderRadius: 8 }}
          >
            {loading ? '修改中...' : '确认修改'}
          </Button>
        </Form.Item>
      </Form>

      {/* 安全提示 */}
      <Alert
        message="重要提示"
        description="密码修改成功后，您需要使用新密码重新登录。请确保记住新密码。"
        type="warning"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
}
