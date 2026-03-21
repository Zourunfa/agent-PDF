/**
 * 清理工具：删除没有 user_profiles 记录的 auth.users
 * 用于修复删除不完整的问题
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromHeaders } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    const supabase = createAdminClient();

    // 获取所有 auth.users
    const { data: authUsersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const authUsers = authUsersData?.users || [];

    // 获取所有 user_profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id');

    const profileIds = new Set((profiles || []).map(p => p.id));

    // 找出没有 user_profiles 的 auth.users
    const orphanedAuthUsers = authUsers.filter((u: any) => !profileIds.has(u.id));

    console.log('[Cleanup] 总 auth.users:', authUsers.length);
    console.log('[Cleanup] 总 user_profiles:', profileIds.size);
    console.log('[Cleanup] 需要清理的 auth.users:', orphanedAuthUsers.length);

    // 删除这些孤立的 auth.users
    const results = [];
    for (const authUser of orphanedAuthUsers) {
      console.log('[Cleanup] 删除孤立用户:', authUser.email);

      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);

      results.push({
        id: authUser.id,
        email: authUser.email,
        success: !deleteError,
        error: deleteError?.message,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAuthUsers: authUsers.length,
        totalProfiles: profileIds.size,
        orphanedCount: orphanedAuthUsers.length,
        deleted: results.filter(r => r.success).length,
        results,
      },
    });
  } catch (error: any) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // GET 请求只查看，不删除
  try {
    const { isAdmin, error: authError } = await getAdminFromHeaders(req.headers);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data: authUsersData } = await supabase.auth.admin.listUsers();
    const { data: profiles } = await supabase.from('user_profiles').select('id');

    const authUsers = authUsersData?.users || [];
    const profileIds = new Set((profiles || []).map(p => p.id));
    const orphanedAuthUsers = authUsers.filter((u: any) => !profileIds.has(u.id));

    return NextResponse.json({
      success: true,
      data: {
        totalAuthUsers: authUsers.length,
        totalProfiles: profileIds.size,
        orphanedCount: orphanedAuthUsers.length,
        orphanedUsers: orphanedAuthUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          createdAt: u.created_at,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
