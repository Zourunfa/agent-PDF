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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        加载中...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UserCenterLayout>
      <PasswordChange />
    </UserCenterLayout>
  );
}
