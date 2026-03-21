/**
 * 检查 Supabase 连接配置
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 获取项目信息
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    return NextResponse.json({
      success: true,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      },
      authUsers: {
        count: users?.length || 0,
        users: users?.map(u => ({
          id: u.id,
          email: u.email,
          emailConfirmed: !!u.email_confirmed_at,
          createdAt: u.created_at
        })) || []
      },
      error
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
