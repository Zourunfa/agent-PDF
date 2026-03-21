/**
 * 测试端点：无需认证获取用户列表（仅用于调试）
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 从 auth.users 获取所有注册用户
    const { data: authUsersData, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      throw listUsersError;
    }

    const authUsers = authUsersData?.users || [];

    // 从 user_profiles 获取已完善的用户资料
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, name, email, role');

    // 创建 profile 映射
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // 合并数据
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
          role: profile?.role || 'user',
          emailVerified: !!authUser.email_confirmed_at,
          hasProfile: !!profile,
          createdAt: profile?.created_at || authUser.created_at,
          lastSigninAt: authUser.last_sign_in_at || null,
          pdfCount: pdfCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        total: usersWithStats.length,
      },
    });
  } catch (error: any) {
    console.error('[Test Users] Error:', error);
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
