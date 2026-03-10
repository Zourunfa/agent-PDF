'use client';

/**
 * Avatar Upload Component
 *
 * 头像上传组件，支持裁剪和预览
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess: (avatarUrl: string) => void;
}

export function AvatarUpload({ currentAvatar, onUploadSuccess }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('只支持 JPG、PNG、GIF 和 WebP 格式的图片');
      return;
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      setError('头像文件大小不能超过 5MB');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 上传文件
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onUploadSuccess(data.data.avatarUrl);
      } else {
        setError(data.error?.message || '上传失败');
        setPreview(currentAvatar);
      }
    } catch (err) {
      setError('上传失败，请重试');
      setPreview(currentAvatar);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div
          className={`w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg ${
            uploading ? 'opacity-50' : ''
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="头像预览"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? '上传中...' : '更换头像'}
      </Button>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        支持 JPG、PNG、GIF、WebP 格式，最大 5MB
      </p>
    </div>
  );
}
