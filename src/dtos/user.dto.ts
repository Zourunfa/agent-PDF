import { z } from 'zod';

/**
 * 更新用户资料请求 Schema
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL format')
    .optional()
    .nullable(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

/**
 * 更新资料响应
 */
export interface UpdateProfileResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  };
  message: string;
}

/**
 * 修改密码请求 Schema
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;

/**
 * 修改密码响应
 */
export interface ChangePasswordResult {
  message: string;
}

/**
 * 用户统计信息
 */
export interface UserStatsResult {
  totalPdfs: number;
  totalConversations: number;
  totalMessages: number;
  storageUsed: number;
  storageLimit: number;
  pdfUploadsDaily: number;
  pdfUploadsDailyLimit: number;
  aiCallsDaily: number;
  aiCallsDailyLimit: number;
}

/**
 * 头像上传响应
 */
export interface AvatarUploadResult {
  avatarUrl: string;
  message: string;
}
