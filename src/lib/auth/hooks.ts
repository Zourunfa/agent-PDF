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
          setState({
            user: session.user,
            profile: null, // TODO: 从 API 获取 profile
            loading: false,
            error: null,
          });

          // 获取用户 profile
          try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
              const data = await response.json();
              setState((prev) => ({
                ...prev,
                profile: data.user,
              }));
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
        setState({
          user: session.user,
          profile: null,
          loading: false,
          error: null,
        });

        // 获取用户 profile
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            setState((prev) => ({
              ...prev,
              profile: data.user,
            }));
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

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.profile?.role === 'admin',
    isPremium: state.profile?.role === 'premium' || state.profile?.role === 'admin',
  };
}
