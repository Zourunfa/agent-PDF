'use client';

/**
 * Stats Page - User Center
 *
 * 使用统计页面
 */

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserCenterLayout } from '@/components/user/UserCenterLayout';
import { UserStats } from '@/components/user/UserStats';
import { UserStatsSkeleton } from '@/components/user/Skeleton';
import { ErrorBoundary } from '@/components/user/ErrorBoundary';

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
      <UserCenterLayout>
        <UserStatsSkeleton />
      </UserCenterLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UserCenterLayout>
      <ErrorBoundary>
        <div className="page-enter">
          <UserStats />
        </div>
      </ErrorBoundary>
    </UserCenterLayout>
  );
}
