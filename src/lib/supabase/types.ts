// Supabase 类型定义

import { Database } from './database.types';

// 用户资料类型
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// 配额相关类型
export type QuotaDefinition = Database['public']['Tables']['quota_definitions']['Row'];
export type UserQuota = Database['public']['Tables']['user_quotas']['Row'];
export type QuotaUsage = Database['public']['Tables']['quota_usage']['Row'];

// PDF相关类型
export type UserPdf = Database['public']['Tables']['user_pdfs']['Row'];

// 会话相关类型
export type UserSession = Database['public']['Tables']['user_sessions']['Row'];

// 系统配置类型
export type SystemConfig = Database['public']['Tables']['system_config']['Row'];

// 审计日志类型
export type AdminAuditLog = Database['public']['Tables']['admin_audit_logs']['Row'];

// 邮件日志类型
export type EmailLog = Database['public']['Tables']['email_logs']['Row'];

// 扩展的 Auth User 类型
export interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  role?: 'user' | 'premium' | 'admin';
}

// 配额状态类型
export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  resetsAt?: string;
}

// 配额响应类型
export interface QuotasResponse {
  pdfUploads: QuotaStatus;
  aiCalls: QuotaStatus;
  storage: QuotaStatus;
  vectorStorage?: QuotaStatus;
}
