// Supabase 管理员客户端
// 使用 SERVICE_ROLE_KEY 绕过 RLS 限制，仅用于服务端管理员操作
//
// ⚠️ 重要：此模块使用延迟加载模式，环境变量在运行时检查，而非构建时
// 这允许 Vercel 在没有设置环境变量的情况下完成构建

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// 缓存的管理员客户端实例（延迟初始化）
let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * 创建管理员 Supabase 客户端
 * ⚠️ 警告：此客户端绕过所有 RLS 策略，仅用于服务端管理员操作
 * ⚠️ 永远不要在客户端代码中使用
 */
export function createAdminClient() {
  // 如果已经有缓存的实例，直接返回
  if (_adminClient) {
    return _adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  _adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

/**
 * 管理员操作：获取任意用户的资料
 */
export async function adminGetUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
}

/**
 * 管理员操作：更新用户资料
 */
export async function adminUpdateUser(
  userId: string,
  updates: {
    email?: string;
    password?: string;
    email_confirm?: boolean;
  }
) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(userId, updates);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

/**
 * 管理员操作：删除用户
 */
export async function adminDeleteUser(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * 管理员操作：列出所有用户
 */
export async function adminListUsers(page = 1, perPage = 50) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return data;
}
