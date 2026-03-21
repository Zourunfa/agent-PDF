/**
 * Debug User API - 临时调试接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 检查 user_profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');

    // 检查 auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    return NextResponse.json({
      profiles: profiles || [],
      profileCount: profiles?.length || 0,
      authUsers: authUsers?.users || [],
      authUserCount: authUsers?.users?.length || 0,
      errors: {
        profileError: profileError?.message,
        authError: authError?.message
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
