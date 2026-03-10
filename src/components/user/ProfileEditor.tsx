'use client';

/**
 * Profile Editor Component
 *
 * 用户资料编辑组件
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from './AvatarUpload';

interface ProfileData {
  name: string;
  avatar: string;
}

interface ProfileEditorProps {
  onSave?: () => void;
}

export function ProfileEditor({ onSave }: ProfileEditorProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        avatar: profile.avatar || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onSave?.();
      } else {
        setError(data.error?.message || '保存失败');
      }
    } catch (err) {
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (avatarUrl: string) => {
    setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    onSave?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">个人资料</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 头像上传 */}
        <div>
          <Label>头像</Label>
          <div className="mt-2">
            <AvatarUpload currentAvatar={formData.avatar} onUploadSuccess={handleAvatarUpload} />
          </div>
        </div>

        {/* 姓名 */}
        <div>
          <Label htmlFor="name">姓名</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-2"
            placeholder="请输入您的姓名"
            maxLength={100}
            required
          />
          <p className="mt-1 text-sm text-gray-500">{formData.name.length} / 100</p>
        </div>

        {/* 邮箱（只读） */}
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={profile?.email || ''}
            readOnly
            disabled
            className="mt-2 bg-gray-50"
          />
          <p className="mt-1 text-sm text-gray-500">邮箱地址不可修改</p>
        </div>

        {/* 提示信息 */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">保存成功！</p>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </form>
    </div>
  );
}
