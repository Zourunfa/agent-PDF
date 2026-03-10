/**
 * User Profile Component - Ant Design Modern
 * 用户资料展示和编辑组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  message,
  Upload,
  Space,
  Divider,
  Descriptions,
  Badge,
  Tag,
  Alert,
  Spin,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuth } from '@/lib/auth/hooks';
import { apiPut, apiPost, apiFetch } from '@/lib/utils/api-fetch';

interface UserProfileData {
  name?: string;
  email?: string;
  avatar_url?: string;
  email_verified?: boolean;
  created_at?: string;
  status?: string;
}

export function UserProfile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [profileData, setProfileData] = useState<UserProfileData>({});

  useEffect(() => {
    if (user && profile) {
      setProfileData({
        name: profile.name || '',
        email: user.email,
        avatar_url: profile.avatar_url || '',
        email_verified: profile.email_verified || false,
        created_at: profile.created_at,
        status: profile.status || 'active',
      });
      form.setFieldsValue({
        name: profile.name || '',
      });
    }
  }, [user, profile, form]);

  // 更新用户名
  const handleUpdateProfile = async (values: any) => {
    setSaving(true);
    try {
      const data = await apiPut('/api/user/profile', { name: values.name });

      if (!data.success) {
        throw new Error(data.message || '更新失败');
      }

      message.success('用户名修改成功！');
      setEditing(false);
      await refreshProfile();
    } catch (err: any) {
      message.error(err.message || '更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // 上传头像
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // 使用 apiFetch 处理 FormData（自动检测并设置正确的 Content-Type）
      const response = await apiFetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '上传失败');
      }

      message.success('头像上传成功！');
      await refreshProfile();
      onSuccess?.(data);
    } catch (err: any) {
      message.error(err.message || '上传失败，请稍后重试');
      onError?.(err);
    } finally {
      setUploading(false);
    }
  };

  // 重新发送验证邮件
  const handleResendVerification = async () => {
    setEmailSending(true);
    try {
      const data = await apiPost('/api/auth/resend-verification');

      if (!data.success) {
        throw new Error(data.message || '发送失败');
      }

      message.success('验证邮件已发送！');

      // 开始60秒倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      message.error(err.message || '发送失败，请稍后重试');
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    customRequest: handleUpload,
    accept: 'image/*',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB！');
        return false;
      }
      return true;
    },
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={{ padding: 32 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8, color: '#1E1B4B' }}>
          个人资料
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>查看和编辑您的个人信息</p>
      </div>

      {/* 基本信息展示 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
          {/* 头像 */}
          <div style={{ position: 'relative' }}>
            <Badge dot={!profileData.email_verified} offset={[-5, 5]}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: profileData.avatar_url
                    ? `url(${profileData.avatar_url}) center/cover`
                    : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #fff',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                {!profileData.avatar_url && (
                  <UserOutlined style={{ fontSize: 40, color: '#fff' }} />
                )}
              </div>
            </Badge>
            <Upload {...uploadProps} disabled={uploading}>
              <Button
                icon={<CameraOutlined />}
                loading={uploading}
                size="small"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#6366F1',
                  borderColor: '#6366F1',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  padding: 0,
                }}
              />
            </Upload>
          </div>

          {/* 基本信息 */}
          <div style={{ flex: 1 }}>
            <Descriptions column={2} size="middle">
              <Descriptions.Item
                label={<span style={{ color: '#6B7280', fontSize: 13 }}>邮箱</span>}
              >
                <Space>
                  <MailOutlined style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: 14 }}>{profileData.email}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#6B7280', fontSize: 13 }}>注册时间</span>}
              >
                <span style={{ fontSize: 14 }}>{formatDate(profileData.created_at)}</span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#6B7280', fontSize: 13 }}>账户状态</span>}
              >
                <Tag color={profileData.status === 'active' ? 'success' : 'default'}>
                  {profileData.status === 'active' ? '活跃' : profileData.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#6B7280', fontSize: 13 }}>邮箱验证</span>}
              >
                {profileData.email_verified ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    已验证
                  </Tag>
                ) : (
                  <Space>
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      未验证
                    </Tag>
                    <Button
                      type="link"
                      size="small"
                      onClick={handleResendVerification}
                      loading={emailSending}
                      disabled={countdown > 0}
                      style={{ padding: 0, fontSize: 13 }}
                    >
                      {countdown > 0 ? `${countdown}秒后重试` : '重新发送验证邮件'}
                    </Button>
                  </Space>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </div>

      <Divider />

      {/* 用户名编辑 */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>用户名</h2>
          {!editing && (
            <Button type="primary" onClick={() => setEditing(true)} size="small">
              编辑
            </Button>
          )}
        </div>

        <Form form={form} layout="vertical" onFinish={handleUpdateProfile} requiredMark={false}>
          <Form.Item
            name="name"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { max: 100, message: '用户名长度不能超过100个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="您的用户名"
              size="large"
              disabled={!editing}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {editing && (
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving} size="large">
                  保存修改
                </Button>
                <Button onClick={() => setEditing(false)} size="large">
                  取消
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </div>

      {/* 安全提示 */}
      {!profileData.email_verified && (
        <Alert
          message="邮箱未验证"
          description="验证邮箱后可以完整使用所有功能，包括接收重要通知和恢复账户访问。"
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
          action={
            <Button
              type="link"
              onClick={handleResendVerification}
              loading={emailSending}
              disabled={countdown > 0}
            >
              立即验证
            </Button>
          }
        />
      )}
    </div>
  );
}
