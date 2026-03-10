'use client';

/**
 * User Center Main Page
 *
 * 用户中心主页
 */

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { QuotaDisplay } from '@/components/quota/QuotaDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserCenterPage() {
  const { user, profile, loading, isPremium } = useAuth();
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

  if (!user || !profile) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      user: '免费用户',
      premium: '高级用户',
      admin: '管理员',
    };
    return roles[role] || '未知';
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      user: 'bg-gray-100 text-gray-800 border-gray-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'premium' || role === 'admin') {
      return (
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">用户中心</h1>
          <p className="mt-2 text-gray-600">管理您的账户信息和偏好设置</p>
        </div>

        {/* 今日配额 */}
        <div className="mb-8">
          <QuotaDisplay />
        </div>

        {/* 升级提示（仅免费用户显示） */}
        {!isPremium && (
          <Alert className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-purple-800">升级到高级版</h3>
                <AlertDescription className="mt-1 text-sm text-purple-700">
                  解锁更多配额和高级功能，享受更流畅的体验。
                  <Link href="/pricing" className="ml-2 font-medium underline hover:text-purple-900">
                    查看详情
                  </Link>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* 用户基本信息卡片 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* 头像 */}
            <div className="flex-shrink-0">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt="用户头像"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* 用户信息 */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{profile.name || '未设置姓名'}</h2>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="mt-3 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(profile.role)}`}>
                  {getRoleIcon(profile.role)}
                  {getRoleLabel(profile.role)}
                </span>
                {profile.emailVerified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    已验证
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    未验证
                  </span>
                )}
              </div>
            </div>

            {/* 注册时间 */}
            <div className="text-center sm:text-right text-sm text-gray-500">
              <p>注册时间</p>
              <p className="font-medium text-gray-900">
                {new Date(profile.createdAt || user.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>

        {/* 功能模块卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 个人资料 */}
          <Link
            href="/user-center/profile"
            className="group bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-blue-200"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">个人资料</h3>
                <p className="text-sm text-gray-600">编辑您的个人信息</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* 使用统计 */}
          <Link
            href="/user-center/stats"
            className="group bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-green-200"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-full p-3 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">使用统计</h3>
                <p className="text-sm text-gray-600">查看您的使用情况</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* 修改密码 */}
          <Link
            href="/user-center/change-password"
            className="group bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-purple-200"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 rounded-full p-3 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">修改密码</h3>
                <p className="text-sm text-gray-600">更新您的账户密码</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* 快速提示 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">温馨提示</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>定期更换密码以保护账户安全</li>
                  <li>完成邮箱验证以解锁全部功能</li>
                  <li>上传的 PDF 文档会自动保存，随时可以继续对话</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
