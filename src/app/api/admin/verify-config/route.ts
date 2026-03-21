/**
 * 验证当前运行时的实际配置
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
  };

  // 1. 显示当前运行时的环境变量
  results.runtimeConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50) + '...',
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
  };

  // 2. 解析 JWT token 获取项目信息
  const decodeJwt = (token: string) => {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return {
        ref: payload.ref, // 项目引用
        role: payload.role,
        iss: payload.iss,
      };
    } catch (e) {
      return { error: 'Invalid token' };
    }
  };

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  results.anonKeyDecoded = decodeJwt(anonKey);
  results.serviceKeyDecoded = decodeJwt(serviceKey);

  // 3. 使用 service_role_key 尝试不同的查询方式
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 方式1: 通过 auth.admin.listUsers()
  try {
    const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers();
    results.method1_listUsers = {
      success: !listError,
      count: listData?.users?.length || 0,
      error: listError?.message,
    };
  } catch (e: any) {
    results.method1_listUsers = { error: e.message };
  }

  // 方式2: 直接通过 RPC 查询
  try {
    const { data: rpcData, error: rpcError } = await serviceClient.rpc('admin_delete_user_profile', {
      target_user_id: '00000000-0000-0000-0000-000000000000'
    });
    results.method2_rpcTest = {
      canCallRpc: !rpcError || rpcError.message.includes('user_profiles_pkey'),
      error: rpcError?.message,
    };
  } catch (e: any) {
    results.method2_rpcTest = { error: e.message };
  }

  // 方式3: 直接查询表
  try {
    const { data: tableData, error: tableError } = await serviceClient
      .from('user_profiles')
      .select('id, email, name')
      .limit(10);

    results.method3_tableQuery = {
      success: !tableError,
      count: tableData?.length || 0,
      sample: tableData?.slice(0, 2),
      error: tableError?.message,
    };
  } catch (e: any) {
    results.method3_tableQuery = { error: e.message };
  }

  // 4. 测试 service_role_key 是否真的有 service_role 权限
  try {
    // 尝试创建一个测试用户（会失败，但能看出权限）
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: createUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true,
    });

    if (createUser?.user) {
      // 创建成功，删除测试用户
      await serviceClient.auth.admin.deleteUser(createUser.user.id);
      results.serviceRolePermission = 'FULL_ACCESS';
    } else if (createError?.message.includes('limit')) {
      results.serviceRolePermission = 'RATE_LIMITED';
    } else {
      results.serviceRolePermission = 'ERROR: ' + createError?.message;
    }
  } catch (e: any) {
    results.serviceRolePermission = 'ERROR: ' + e.message;
  }

  return NextResponse.json(results);
}
