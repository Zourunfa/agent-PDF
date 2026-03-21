/**
 * 使用 ANON_KEY 测试能否获取到用户
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    config: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  };

  // 方法1: 使用 ANON_KEY（登录用这个）
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 尝试用 ANON_KEY 登录
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: '1804491927@qq.com',
      password: 'aa123321',
    });

    results.anonKeySignIn = {
      success: !signInError,
      userId: signInData?.user?.id,
      email: signInData?.user?.email,
      error: signInError?.message,
    };

    // 登录成功后，尝试获取用户信息
    if (signInData?.user) {
      const { data: userData, error: userError } = await anonClient
        .from('user_profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      results.anonKeyProfile = {
        success: !userError,
        profile: userData,
        error: userError?.message,
      };
    }
  } catch (error: any) {
    results.anonKeyTest = { error: error.message };
  }

  // 方法2: 使用 SERVICE_ROLE_KEY（管理后台用这个）
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers();

    results.serviceRoleList = {
      userCount: listData?.users?.length || 0,
      users: listData?.users?.map(u => ({
        id: u.id,
        email: u.email,
      })) || [],
      error: listError?.message,
    };
  } catch (error: any) {
    results.serviceRoleList = { error: error.message };
  }

  // 方法3: 使用 SERVICE_ROLE_KEY 直接查询表
  try {
    const { data: profiles, error: profilesError } = await serviceClient
      .from('user_profiles')
      .select('*');

    results.serviceRoleProfiles = {
      count: profiles?.length || 0,
      profiles: profiles?.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
      })) || [],
      error: profilesError?.message,
    };
  } catch (error: any) {
    results.serviceRoleProfiles = { error: error.message };
  }

  // 对比结论
  results.conclusion = {
    anonKeyCanSignIn: !!results.anonKeySignIn?.success,
    serviceRoleCanList: results.serviceRoleList?.userCount > 0,
    sameData: results.anonKeySignIn?.userId === results.serviceRoleList?.users?.[0]?.id,
  };

  return NextResponse.json(results);
}
