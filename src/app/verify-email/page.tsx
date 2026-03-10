// 邮箱验证页面
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Mail, RefreshCw } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (success === 'true') {
      setStatus('success');
      return;
    }

    if (error) {
      setStatus('error');
      switch (error) {
        case 'TOKEN_EXPIRED':
          setErrorMessage('验证链接已过期，请重新发送验证邮件');
          break;
        case 'INVALID_TOKEN':
          setErrorMessage('无效的验证链接');
          break;
        case 'missing_token':
          setErrorMessage('缺少验证令牌');
          break;
        default:
          setErrorMessage('验证失败，请稍后重试');
      }
      return;
    }

    // 如果有 token，自动验证
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setErrorMessage('缺少验证令牌');
    }
  }, [token, error, success]);

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        if (data.error === 'TOKEN_EXPIRED') {
          setErrorMessage('验证链接已过期，请重新发送验证邮件');
        } else if (data.error === 'INVALID_TOKEN') {
          setErrorMessage('无效的验证链接');
        } else {
          setErrorMessage(data.message || '验证失败，请稍后重试');
        }
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // 这里可以添加重发验证邮件的逻辑
    // 需要用户登录才能重发
    router.push('/login?resend_verification=true');
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">正在验证...</CardTitle>
              <CardDescription>
                请稍候，我们正在验证您的邮箱
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">邮箱验证成功</CardTitle>
              <CardDescription>
                您的邮箱已成功验证
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium mb-1">验证完成</p>
                    <p className="text-xs">
                      您的邮箱已成功验证，现在可以享受所有功能了。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>下一步：</strong>您现在可以使用您的账户登录并开始使用 PDF AI Chat。
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                前往登录
              </Button>

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回首页
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">验证失败</CardTitle>
              <CardDescription>
                邮箱验证失败
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium mb-1">验证失败</p>
                    <p className="text-xs">{errorMessage}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>解决方案：</strong>您可以重新发送验证邮件或联系客服获取帮助。
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                重新发送验证邮件
              </Button>

              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                返回登录
              </Button>

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回首页
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
