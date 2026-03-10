// 认证导航栏组件
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import { GuestQuotaIndicator } from './GuestQuotaIndicator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, User, Shield, LogOut, ChevronDown } from 'lucide-react';

export function AuthHeader() {
  const { user, profile, loading, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 右侧 */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-32 animate-pulse rounded-md bg-gray-200" />
            ) : isAuthenticated ? (
              <>
                {/* 游客配额提示 */}
                {!user && <GuestQuotaIndicator />}

                {/* 用户菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-medium text-white">
                        {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="hidden text-sm font-medium sm:block">
                        {profile?.name || user?.email}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/user-center" className="flex items-center gap-3 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>个人中心</span>
                      </Link>
                    </DropdownMenuItem>

                    {profile?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-3 cursor-pointer">
                          <Shield className="h-4 w-4" />
                          <span>管理后台</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-3 cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>登出</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* 游客配额提示 */}
                <GuestQuotaIndicator />

                {/* 登录/注册按钮 */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">登录</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">注册</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
