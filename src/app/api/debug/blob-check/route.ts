/**
 * Blob Storage Health Check API
 * 用于诊断 Vercel Blob Storage 配置问题
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    blobToken: {
      configured: !!process.env.BLOB_READ_WRITE_TOKEN,
      prefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + '...',
    },
    vercelUrl: {
      configured: !!process.env.VERCEL_URL,
      value: process.env.VERCEL_URL,
    },
    vercelEnv: {
      configured: !!process.env.VERCEL_ENV,
      value: process.env.VERCEL_ENV,
    },
  };

  const issues: string[] = [];

  if (!checks.blobToken.configured) {
    issues.push('BLOB_READ_WRITE_TOKEN 未设置');
  }

  if (!checks.vercelUrl.configured) {
    issues.push('VERCEL_URL 未设置');
  }

  if (!checks.vercelEnv.configured) {
    issues.push('VERCEL_ENV 未设置');
  }

  // Test upload
  let uploadTest = { success: false, error: '' };
  if (issues.length === 0) {
    try {
      const { put } = await import('@vercel/blob');
      const testBlob = await put('test.txt', Buffer.from('test'), {
        access: 'private',
      });
      uploadTest = { success: true, error: '' };

      // Clean up test file
      const { del } = await import('@vercel/blob');
      await del(testBlob.url);
    } catch (error) {
      uploadTest = {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  return NextResponse.json({
    success: issues.length === 0,
    checks,
    issues,
    uploadTest,
    recommendation: issues.length > 0
      ? '请修复上述环境变量配置问题'
      : uploadTest.success
      ? 'Blob Storage 配置正确'
      : '环境变量已设置，但上传失败，请检查 token 是否有效',
  });
}
