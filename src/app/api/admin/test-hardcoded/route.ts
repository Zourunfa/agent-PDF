/**
 * 临时测试：直接硬编码 Service Role Key
 * ⚠️ 仅用于调试，不要在生产环境使用！
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // ⚠️ 从你的 Supabase Dashboard 复制的 service_role key
  // 请访问：https://supabase.com/dashboard/project/jgsxmiojijjjpvbfndvn/settings/api
  const HARDCODED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3htaW9qaWpqanB2YmZuZHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4Mjk3MiwiZXhwIjoyMDg4NjU4OTcyfQ.czbJkR1r-QnvaBR1WV3SkeP88379ANf9fA9RUE3dNEs';

  const results: any = {
    timestamp: new Date().toISOString(),
    method: 'HARDCODED_SERVICE_KEY',
  };

  // 使用硬编码的 key 创建客户端
  const client = createClient(
    'https://jgsxmiojijjjpvbfndvn.supabase.co',
    HARDCODED_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 测试1: 列出用户
  try {
    const { data, error } = await client.auth.admin.listUsers();

    results.listUsers = {
      success: !error,
      count: data?.users?.length || 0,
      users: data?.users?.map(u => ({
        id: u.id,
        email: u.email,
        emailConfirmed: !!u.email_confirmed_at,
      })) || [],
      error: error?.message,
    };
  } catch (e: any) {
    results.listUsers = { error: e.message, stack: e.stack };
  }

  // 测试2: 查询 user_profiles 表
  try {
    const { data, error } = await client
      .from('user_profiles')
      .select('id, email, name, role')
      .limit(10);

    results.userProfiles = {
      success: !error,
      count: data?.length || 0,
      profiles: data || [],
      error: error?.message,
    };
  } catch (e: any) {
    results.userProfiles = { error: e.message, stack: e.stack };
  }

  // 对比：使用环境变量中的 key
  const envClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data, error } = await envClient.auth.admin.listUsers();
    results.envKeyTest = {
      count: data?.users?.length || 0,
      error: error?.message,
    };
  } catch (e: any) {
    results.envKeyTest = { error: e.message };
  }

  // 结论
  results.conclusion = {
    hardcodedKeyWorks: results.listUsers.count > 0,
    envKeyWorks: results.envKeyTest.count > 0,
    bothSame: results.listUsers.count === results.envKeyTest.count,
    recommendation: results.hardcodedKeyWorks
      ? '硬编码的 Key 有效，说明环境变量中的 Key 有问题'
      : '硬编码的 Key 也无效，请从 Dashboard 重新复制 Service Role Key',
  };

  return NextResponse.json(results);
}
