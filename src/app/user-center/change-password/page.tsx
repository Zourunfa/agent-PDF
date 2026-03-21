'use client';

/**
 * Change Password Page - User Center
 *
 * 修改密码页面
 */

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserCenterLayout } from '@/components/user/UserCenterLayout';
import { PasswordChange } from '@/components/user/PasswordChangeNew';
import { PasswordChangeSkeleton } from '@/components/user/Skeleton';
import { ErrorBoundary } from '@/components/user/ErrorBoundary';

export default function ChangePasswordPage() {
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
        <PasswordChangeSkeleton />
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
          <PasswordChange />
        </div>
      </ErrorBoundary>
    </UserCenterLayout>
  );
}
