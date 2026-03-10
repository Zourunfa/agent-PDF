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
      <UserProfile />
    </UserCenterLayout>
  );
}
