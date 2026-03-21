/**
 * Admin Users API Route
 * 管理员获取用户列表接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromHeaders } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const { isAdmin, error: authError } = await getAdminFromHeaders(req.headers);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '需要管理员权限',
          },
        },
        { status: 403 }
      );
    }

    const timestamp = new Date().toISOString();
    const cacheBuster = Math.random();
    console.log('[Admin Users] 获取用户列表 -', timestamp, 'cacheBuster:', cacheBuster);

    const supabase = createAdminClient();

    // 步骤1: 从 auth.users 获取所有注册用户（包括未验证的）
    console.log('[Admin Users] 开始获取 auth.users...');
    const { data: authUsersData, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      console.error('[Admin Users] 获取 auth.users 失败:', listUsersError);
      throw listUsersError;
    }

    const authUsers = authUsersData?.users || [];
    console.log('[Admin Users] 从 auth.users 获取到用户:', authUsers.map(u => ({ id: u.id, email: u.email, confirmed: u.email_confirmed_at })));
    console.log('[Admin Users] authUsersData 完整响应:', JSON.stringify(authUsersData, null, 2));

    // 步骤2: 从 user_profiles 获取已完善的用户资料
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, email, role, avatar_url, created_at, email_verified');

    if (profileError) {
      console.warn('[Admin Users] 获取 user_profiles 失败:', profileError);
    }

    // 创建 profile 映射
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // 步骤3: 合并数据，包含所有 auth.users 的用户
    const usersWithStats = await Promise.all(
      authUsers.map(async (authUser: any) => {
        const profile = profileMap.get(authUser.id);

        // 获取 PDF 数量
        const { count: pdfCount } = await supabase
          .from('user_pdfs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        return {
          id: authUser.id,
          username: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '-',
          email: authUser.email,
          role: profile?.role || 'user', // 没有 profile 的默认为 user
          avatarUrl: profile?.avatar_url || null,
          emailVerified: !!authUser.email_confirmed_at, // 使用 auth.users 的 email_confirmed_at
          hasProfile: !!profile, // 标记是否有完整资料
          createdAt: profile?.created_at || authUser.created_at,
          lastSigninAt: authUser.last_sign_in_at || null,
          pdfCount: pdfCount || 0,
        };
      })
    );

    // 按 email_verified 排序：未验证的排在前面
    usersWithStats.sort((a, b) => {
      if (a.emailVerified === b.emailVerified) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.emailVerified ? 1 : -1;
    });

    console.log('[Admin Users] ✓ 获取到', usersWithStats.length, '个用户（包括未验证的）');
    console.log('[Admin Users] 未验证邮箱的用户:', usersWithStats.filter(u => !u.emailVerified).length);

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        total: usersWithStats.length,
      },
    });
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取用户列表失败',
        },
      },
      { status: 500 }
    );
  }
}
