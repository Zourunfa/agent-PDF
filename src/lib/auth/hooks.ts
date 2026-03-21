// 客户端认证 Hook
'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'premium' | 'admin';
  avatar?: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  useEffect(() => {
    // 获取当前会话
    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setState((prev) => ({
            ...prev,
            user: session.user,
            loading: false,
          }));

          // 获取用户 profile
          try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();

            if (response.ok && data.success && data.user) {
              setState((prev) => ({
                ...prev,
                profile: data.user,
              }));
            } else if (response.status === 401 || response.status === 403) {
              // 用户不存在或被封禁，自动退出登录
              const errorMessage = data.error === 'USER_DELETED'
                ? '您的账户已被删除，请重新注册'
                : data.message || '用户不存在或已被封禁';

              console.error('[Auth] User not found or suspended, signing out...', { error: data.error });
              await supabase.auth.signOut();

              setState({
                user: null,
                profile: null,
                loading: false,
                error: errorMessage,
              });

              // 如果是用户被删除，显示提示并跳转到注册页
              if (data.error === 'USER_DELETED') {
                if (typeof window !== 'undefined') {
                  // 使用 message 显示提示
                  const { message } = await import('antd');
                  message.warning({
                    content: '您的账户已被删除，请重新注册',
                    duration: 5,
                    key: 'user-deleted',
                  });

                  // 延迟后跳转到注册页
                  setTimeout(() => {
                    window.location.href = '/register';
                  }, 2000);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setState({
          user: null,
          profile: null,
          loading: false,
          error: 'Failed to load session',
        });
      }
    }

    getInitialSession();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          user: session.user,
          loading: false,
        }));

        // 获取用户 profile
        try {
          const response = await fetch('/api/auth/me');
          const data = await response.json();

          if (response.ok && data.success && data.user) {
            setState((prev) => ({
              ...prev,
              profile: data.user,
            }));
          } else if (response.status === 401 || response.status === 403) {
            // 用户不存在或被封禁，自动退出登录
            const errorMessage = data.error === 'USER_DELETED'
              ? '您的账户已被删除，请重新注册'
              : data.message || '用户不存在或已被封禁';

            console.error('[Auth] User not found or suspended, signing out...', { error: data.error });
            await supabase.auth.signOut();

            setState({
              user: null,
              profile: null,
              loading: false,
              error: errorMessage,
            });

            // 如果是用户被删除，显示提示并跳转到注册页
            if (data.error === 'USER_DELETED') {
              if (typeof window !== 'undefined') {
                import('antd').then(({ message }) => {
                  message.warning({
                    content: '您的账户已被删除，请重新注册',
                    duration: 5,
                    key: 'user-deleted',
                  });

                  setTimeout(() => {
                    window.location.href = '/register';
                  }, 2000);
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 手动刷新用户信息
  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setState((prev) => ({
          ...prev,
          profile: data.user,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return false;
    }
  };

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.profile?.role === 'admin',
    isPremium: state.profile?.role === 'premium' || state.profile?.role === 'admin',
    refreshProfile,
  };
}
