/**
 * Check User API - 检查特定用户的数据库状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = 'b969a004-032c-4486-b695-dd68d725b593';
    const supabase = createAdminClient();

    // 使用原生 SQL 查询，绕过可能的缓存
    const { data: profile, error: profileError } = await supabase
      .rpc('sql', {
        query: `SELECT id, email, name, created_at FROM public.user_profiles WHERE id = '${userId}'`
      });

    // 检查是否存在
    const { data: exists, error: existsError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    return NextResponse.json({
      userId,
      profileExists: !!exists,
      profile,
      profileError: profileError?.message,
      existsError: existsError?.message,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
