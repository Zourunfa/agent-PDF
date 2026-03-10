'use client';

/**
 * Quota Display Component
 *
 * 显示用户的配额使用情况
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, MessageSquare } from 'lucide-react';
import { apiGet } from '@/lib/utils/api-fetch';

interface QuotaStats {
  upload: {
    allowed: boolean;
    quotaLimit: number;
    used: number;
    remaining: number;
    quotaType: 'daily' | 'monthly';
  };
  chat: {
    allowed: boolean;
    quotaLimit: number;
    used: number;
    remaining: number;
    quotaType: 'daily' | 'monthly';
  };
}

export function QuotaDisplay() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // 使用 skipAuthRedirect 避免因认证失败而触发页面跳转
        const data = await apiGet<QuotaStats>('/api/quota/stats', {
          skipAuthRedirect: true,
        });

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        // 静默处理错误，不影响用户体验
        console.log('[QuotaDisplay] Stats not available (user may not be logged in)');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user]);

  if (!isAuthenticated || loading || !stats) {
    return null;
  }

  const getProgressColor = (remaining: number, limit: number) => {
    if (remaining === 0) return 'bg-destructive';
    if (remaining <= limit * 0.2) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">今日配额使用</CardTitle>
        <CardDescription>
          {stats.upload.quotaType === 'daily' ? '每日' : '每月'}配额统计
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 上传配额 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">PDF 上传</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {stats.upload.used} / {stats.upload.quotaLimit}
              </span>
              {stats.upload.remaining === 0 && (
                <Badge variant="destructive" className="text-xs">
                  已达上限
                </Badge>
              )}
            </div>
          </div>
          <Progress value={(stats.upload.used / stats.upload.quotaLimit) * 100} className="h-2" />
          {stats.upload.remaining === 0 && (
            <p className="text-xs text-destructive">今日上传次数已达上限</p>
          )}
        </div>

        {/* 聊天配额 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">AI 聊天</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {stats.chat.used} / {stats.chat.quotaLimit}
              </span>
              {stats.chat.remaining === 0 && (
                <Badge variant="destructive" className="text-xs">
                  已达上限
                </Badge>
              )}
            </div>
          </div>
          <Progress value={(stats.chat.used / stats.chat.quotaLimit) * 100} className="h-2" />
          {stats.chat.remaining === 0 && (
            <p className="text-xs text-destructive">今日聊天次数已达上限</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
