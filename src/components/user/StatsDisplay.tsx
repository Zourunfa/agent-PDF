'use client';

/**
 * Stats Display Component
 *
 * 用户统计展示组件
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/hooks';

interface StatsData {
  total: {
    uploads: number;
    chats: number;
  };
  today: {
    uploads: number;
    chats: number;
  };
  history: Array<{
    date: string;
    uploads: number;
    chats: number;
  }>;
  recentActivity: Array<{
    type: string;
    timestamp: string;
    amount: number;
  }>;
}

export function StatsDisplay() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats');
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">使用统计</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">使用统计</h2>
        <p className="text-gray-500">加载统计数据失败</p>
      </div>
    );
  }

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf_uploads: 'PDF 上传',
      ai_calls: 'AI 聊天',
      storage: '存储使用',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">使用统计</h2>

      {/* 总计统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">总上传次数</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {stats.total.uploads}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">总聊天次数</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {stats.total.chats}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 今日统计 */}
      <div className="border-t pt-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">今日使用</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">PDF 上传</span>
            <span className="font-semibold text-gray-900">
              {stats.today.uploads} 次
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">AI 聊天</span>
            <span className="font-semibold text-gray-900">
              {stats.today.chats} 次
            </span>
          </div>
        </div>
      </div>

      {/* 历史趋势 */}
      <div className="border-t pt-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">最近 7 天趋势</h3>
        <div className="space-y-3">
          {stats.history.map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-600 w-20">
                {formatDate(day.date)}
              </span>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (day.uploads / Math.max(...stats.history.map(d => d.uploads), 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {day.uploads}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (day.chats / Math.max(...stats.history.map(d => d.chats), 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {day.chats}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近活动 */}
      {stats.recentActivity.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">最近活动</h3>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-600">
                  {getActivityTypeLabel(activity.type)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
