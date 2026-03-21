// 认证中间件和辅助函数

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 检查用户是否已认证
 * 用于服务端组件和 API Routes
 */
export async function requireAuth() {
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
 * 获取当前用户的完整信息（包含 profile）
 */
export async function getCurrentUser() {
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

/**
 * 检查用户角色
 * @returns 用户角色或 null
 */
export async function getUserRole(): Promise<'user' | 'premium' | 'admin' | null> {
  const user = await getCurrentUser();

  if (!user || !user.profile) {
    return null;
  }

  return user.profile.role as 'user' | 'premium' | 'admin';
}

/**
 * 检查用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * 检查用户是否为高级用户或管理员
 */
export async function isPremium(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'premium' || role === 'admin';
}

/**
 * 认证中间件：保护需要登录的 API 路由
 */
export async function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '请先登录',
        },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * 管理员权限中间件：保护管理员专用的 API 路由
 */
export async function withAdminAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '请先登录',
        },
        { status: 401 }
      );
    }

    if (!user.profile || user.profile.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: '需要管理员权限',
        },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}

/**
 * API 路由辅助函数：验证请求并返回用户信息
 */
export async function authenticateRequest(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: 'UNAUTHORIZED',
      response: NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '请先登录',
        },
        { status: 401 }
      ),
    };
  }

  return { user, error: null, response: null };
}
