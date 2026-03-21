/**
 * 调试：对比不同客户端获取用户的结果
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    config: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...',
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  };

  console.log('[Debug] === 开始调试 ===');
  console.log('[Debug] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[Debug] Service Key 长度:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

  try {
    // 方法1: 使用 createAdminClient (当前管理后台使用的方法)
    console.log('[Debug] 尝试方法1: createAdminClient');
    const adminClient = createAdminClient();
    const { data: adminData, error: adminError } = await adminClient.auth.admin.listUsers();

    results.method1_adminClient = {
      success: !adminError,
      userCount: adminData?.users?.length || 0,
      error: adminError?.message,
      users: adminData?.users?.map(u => ({
        id: u.id,
        email: u.email,
        emailConfirmed: !!u.email_confirmed_at
      })) || []
    };

    console.log('[Debug] 方法1结果:', results.method1_adminClient);

  } catch (error: any) {
    results.method1_adminClient = {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }

  try {
    // 方法2: 直接使用 createClient + service_role_key
    console.log('[Debug] 尝试方法2: createClient with service_role');
    const directClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    const { data: directData, error: directError } = await directClient.auth.admin.listUsers();

    results.method2_directClient = {
      success: !directError,
      userCount: directData?.users?.length || 0,
      error: directError?.message,
      users: directData?.users?.map(u => ({
        id: u.id,
        email: u.email,
        emailConfirmed: !!u.email_confirmed_at
      })) || []
    };

    console.log('[Debug] 方法2结果:', results.method2_directClient);

  } catch (error: any) {
    results.method2_directClient = {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }

  try {
    // 方法3: 从 user_profiles 表查询（不通过 auth）
    console.log('[Debug] 尝试方法3: 直接查询 user_profiles 表');
    const adminClient = createAdminClient();
    const { data: profiles, error: profilesError } = await adminClient
      .from('user_profiles')
      .select('*');

    results.method3_userProfiles = {
      success: !profilesError,
      count: profiles?.length || 0,
      error: profilesError?.message,
      profiles: profiles?.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        role: p.role,
        emailVerified: p.email_verified
      })) || []
    };

    console.log('[Debug] 方法3结果:', results.method3_userProfiles);

  } catch (error: any) {
    results.method3_userProfiles = {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }

  return NextResponse.json(results);
}
