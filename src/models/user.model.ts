/**
 * 用户角色枚举
 */
export type UserRole = 'user' | 'premium' | 'admin';

/**
 * 用户状态枚举
 */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/**
 * 用户基础模型
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户配额模型
 */
export interface UserQuota {
  pdfUploadsDaily: number;
  pdfUploadsDailyLimit: number;
  aiCallsDaily: number;
  aiCallsDailyLimit: number;
  storageUsed: number;
  storageLimit: number;
  resetAt: Date | null;
}

/**
 * 用户统计模型
 */
export interface UserStats {
  totalPdfs: number;
  totalConversations: number;
  totalMessages: number;
  storageUsed: number;
}

/**
 * 用户完整资料（包含配额和统计）
 */
export interface UserProfile extends User {
  quota: UserQuota;
  stats: UserStats;
}

/**
 * 数据库记录到 User 模型的映射
 */
export function mapDbToUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    email: data.email as string,
    name: data.name as string | null,
    avatarUrl: data.avatar_url as string | null,
    role: (data.role as UserRole) || 'user',
    emailVerified: (data.email_verified as boolean) || false,
    status: (data.status as UserStatus) || 'active',
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * User 模型到数据库记录的映射
 */
export function mapUserToDb(user: Partial<User>): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatarUrl,
    role: user.role,
    email_verified: user.emailVerified,
    status: user.status,
    updated_at: new Date().toISOString(),
  };
}
