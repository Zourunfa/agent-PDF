// Supabase 服务端客户端
// 用于服务端组件和 API Routes 的 Supabase 客户端实例

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * 创建服务端 Supabase 客户端
 * 用于服务端组件和 API Routes
 *
 * 注意：Middleware 会在每个请求中刷新 session 并更新 cookies
 * 这里只需要读取 cookies 即可
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // 在服务端组件中设置 cookie 可能会抛出错误
            // 可以忽略，因为 middleware 会处理 cookie 设置
          }
        },
      },
    }
  );
}

/**
 * 获取当前用户
 * 用于服务端组件和 API Routes
 */
export async function getUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 获取当前用户的完整资料（包含 profile）
 */
export async function getUserWithProfile() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return null;
  }

  return {
    ...user,
    profile,
  };
}
