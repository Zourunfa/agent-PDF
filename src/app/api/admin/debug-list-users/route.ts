/**
 * 调试：直接测试 listUsers API
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const debug: any = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  try {
    debug.steps.push('1. 创建 admin client');
    const supabase = createAdminClient();

    debug.steps.push('2. 检查环境变量');
    debug.envVars = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    };

    debug.steps.push('3. 调用 supabase.auth.admin.listUsers()');
    const { data: authUsersData, error: listUsersError } = await supabase.auth.admin.listUsers();

    debug.listUsersResult = {
      error: listUsersError?.message,
      userCount: authUsersData?.users?.length || 0,
      users: authUsersData?.users?.map(u => ({
        id: u.id,
        email: u.email,
        emailConfirmed: !!u.email_confirmed_at,
      })) || [],
      total: authUsersData?.total,
      aud: authUsersData?.aud,
    };

    if (listUsersError) {
      debug.steps.push('❌ listUsers 调用失败: ' + listUsersError.message);
    } else {
      debug.steps.push(`✓ listUsers 返回 ${authUsersData?.users?.length || 0} 个用户`);
    }

    debug.steps.push('4. 检查 user_profiles 表');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    debug.profilesResult = {
      error: profilesError?.message,
      count: profiles?.length || 0,
      profiles: profiles?.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
      })) || [],
    };

    if (profilesError) {
      debug.steps.push('❌ 查询 user_profiles 失败: ' + profilesError.message);
    } else {
      debug.steps.push(`✓ user_profiles 返回 ${profiles?.length || 0} 条记录`);
    }

    return NextResponse.json({ success: true, debug });
  } catch (error: any) {
    debug.steps.push('❌ 异常: ' + error.message);
    debug.stack = error.stack;
    return NextResponse.json({ success: false, debug, error: error.message }, { status: 500 });
  }
}
