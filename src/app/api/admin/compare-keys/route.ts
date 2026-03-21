/**
 * 对比 ANON_KEY 和 SERVICE_ROLE_KEY 是否属于同一个项目
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
  };

  // 解析 JWT token 获取项目信息
  const base64UrlDecode = (str: string) => {
    const parts = str.split('.');
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString();
    return JSON.parse(decoded);
  };

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  try {
    const anonDecoded = base64UrlDecode(anonKey);
    const serviceDecoded = base64UrlDecode(serviceKey);

    results.anonKey = {
      ref: anonDecoded.ref, // 项目 ID
      role: anonDecoded.role,
    };

    results.serviceKey = {
      ref: serviceDecoded.ref, // 项目 ID
      role: serviceDecoded.role,
    };

    results.sameProject = anonDecoded.ref === serviceDecoded.ref;

    // 用两个 key 分别创建客户端测试
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey
    );

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 使用 anon client 尝试登录（模拟用户登录）
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: '1804491927@qq.com',
      password: 'aa123321', // 假设这是测试密码
    });

    results.anonClientTest = {
      canSignIn: !signInError,
      userFound: !!signInData.user,
      userId: signInData.user?.id,
      error: signInError?.message,
    };

    // 使用 service client 列出用户
    const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers();

    results.serviceClientTest = {
      canListUsers: !listError,
      userCount: listData?.users?.length || 0,
      error: listError?.message,
    };

  } catch (error: any) {
    results.error = error.message;
  }

  return NextResponse.json(results);
}
