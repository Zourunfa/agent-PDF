'use client';

/**
 * Profile Page - User Center
 *
 * 个人资料页面
 */

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserCenterLayout } from '@/components/user/UserCenterLayout';
import { UserProfile } from '@/components/user/UserProfile';
import { UserProfileSkeleton } from '@/components/user/Skeleton';
import { ErrorBoundary } from '@/components/user/ErrorBoundary';

export default function ProfilePage() {
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
        <UserProfileSkeleton />
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
          <UserProfile />
        </div>
      </ErrorBoundary>
    </UserCenterLayout>
  );
}
