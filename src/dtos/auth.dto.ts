import { z } from 'zod';

/**
 * 登录请求 Schema
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * 登录响应
 */
export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  };
  token: string;
}

/**
 * 注册请求 Schema
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

/**
 * 注册响应
 */
export interface RegisterResult {
  userId: string;
  email: string;
  message: string;
}

/**
 * 忘记密码请求 Schema
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

/**
 * 忘记密码响应
 */
export interface ForgotPasswordResult {
  message: string;
}

/**
 * 重置密码请求 Schema
 */
export const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

/**
 * 重置密码响应
 */
export interface ResetPasswordResult {
  message: string;
}

/**
 * 验证邮箱请求 Schema
 */
export const VerifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
});

export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;

/**
 * 验证邮箱响应
 */
export interface VerifyEmailResult {
  message: string;
  verified: boolean;
}

/**
 * 重新发送验证邮件请求 Schema
 */
export const ResendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
});

export type ResendVerificationDTO = z.infer<typeof ResendVerificationSchema>;

/**
 * 当前用户信息响应
 */
export interface MeResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    emailVerified: boolean;
  } | null;
}
