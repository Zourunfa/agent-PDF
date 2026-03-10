'use client';

/**
 * Stats Page
 *
 * 使用统计页面
 */

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { StatsDisplay } from '@/components/user/StatsDisplay';
import { QuotaDisplay } from '@/components/quota/QuotaDisplay';

export default function StatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/user-center"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回用户中心
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">使用统计</h1>
          <p className="mt-2 text-gray-600">查看您的配额使用情况和历史趋势</p>
        </div>

        <div className="space-y-6">
          {/* 今日配额 */}
          <QuotaDisplay />

          {/* 使用统计 */}
          <StatsDisplay />
        </div>
      </div>
    </div>
  );
}
