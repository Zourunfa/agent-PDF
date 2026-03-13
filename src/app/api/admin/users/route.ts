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

    console.log('[Admin Users] 获取用户列表');

    const supabase = createAdminClient();

    // 获取用户列表
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, name, email, role, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 获取每个用户的 PDF 数量和聊天统计
    const usersWithStats = await Promise.all(
      (users || []).map(async (user: any) => {
        // 获取 PDF 数量
        const { count: pdfCount } = await supabase
          .from('user_pdfs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          id: user.id,
          username: user.name || user.email?.split('@')[0] || '-',
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          lastSigninAt: null,
          pdfCount: pdfCount || 0,
        };
      })
    );

    console.log('[Admin Users] ✓ 获取到', usersWithStats.length, '个用户');

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
