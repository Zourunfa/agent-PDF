/**
 * 测试端点：验证环境变量是否正确加载
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const envInfo = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      serviceKeyFirstChars: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20),
    },
    test: {
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    }
  };

  return NextResponse.json(envInfo);
}
