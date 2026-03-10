// Supabase 管理员客户端
// 使用 SERVICE_ROLE_KEY 绕过 RLS 限制，仅用于服务端管理员操作

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * 创建管理员 Supabase 客户端
 * ⚠️ 警告：此客户端绕过所有 RLS 策略，仅用于服务端管理员操作
 * ⚠️ 永远不要在客户端代码中使用
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// 导出单例管理员客户端
export const supabaseAdmin = createAdminClient();

/**
 * 管理员操作：获取任意用户的资料
 */
export async function adminGetUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
}

/**
 * 管理员操作：更新用户资料
 */
export async function adminUpdateUser(userId: string, updates: {
  email?: string;
  password?: string;
  email_confirm?: boolean;
}) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    updates
  );

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

/**
 * 管理员操作：删除用户
 */
export async function adminDeleteUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * 管理员操作：列出所有用户
 */
export async function adminListUsers(page = 1, perPage = 50) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return data;
}
