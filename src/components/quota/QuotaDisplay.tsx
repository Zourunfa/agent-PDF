'use client';

/**
 * Quota Display Component - Ant Design
 * 显示用户的配额使用情况
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { Card, Progress, Tag, Space, Spin } from 'antd';
import {
  FileTextOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
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
        const data = await apiGet<QuotaStats>('/api/quota/stats', {
          skipAuthRedirect: true,
        });

        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.log('[QuotaDisplay] Stats not available');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user]);

  if (!isAuthenticated || loading || !stats) {
    if (loading && isAuthenticated) {
      return (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <Spin />
        </div>
      );
    }
    return null;
  }

  const percentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const isExhausted = (remaining: number) => remaining === 0;
  const isLow = (remaining: number, limit: number) => remaining > 0 && remaining <= limit * 0.2;

  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#6366F1' }} />
          <span>今日配额</span>
        </Space>
      }
      style={{ borderRadius: 12 }}
    >
      {/* PDF 上传配额 */}
      <div style={{ marginBottom: stats.chat.quotaLimit > 0 ? 28 : 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isExhausted(stats.upload.remaining)
                  ? '#FEE2E2'
                  : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileTextOutlined
                style={{
                  fontSize: 16,
                  color: isExhausted(stats.upload.remaining) ? '#EF4444' : '#6366F1',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>PDF 上传</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {stats.upload.quotaType === 'daily' ? '每日' : '每月'}限额 {stats.upload.quotaLimit}{' '}
                次
              </div>
            </div>
          </div>
          <Space size={8}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B' }}>
              {stats.upload.used}
            </span>
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>/ {stats.upload.quotaLimit}</span>
            {isExhausted(stats.upload.remaining) && (
              <Tag color="error" style={{ margin: 0 }}>
                已用完
              </Tag>
            )}
            {isLow(stats.upload.remaining, stats.upload.quotaLimit) && (
              <Tag color="warning" style={{ margin: 0 }}>
                即将用完
              </Tag>
            )}
          </Space>
        </div>
        <Progress
          percent={percentage(stats.upload.used, stats.upload.quotaLimit)}
          strokeColor={
            isExhausted(stats.upload.remaining)
              ? '#EF4444'
              : isLow(stats.upload.remaining, stats.upload.quotaLimit)
                ? '#F59E0B'
                : '#6366F1'
          }
          trailColor="#F3F4F6"
          size="default"
          showInfo={false}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            已使用 {percentage(stats.upload.used, stats.upload.quotaLimit)}%
          </span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>剩余 {stats.upload.remaining} 次</span>
        </div>
      </div>

      {/* AI 聊天配额 */}
      <div style={{ marginBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isExhausted(stats.chat.remaining)
                  ? '#F3E8FF'
                  : 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageOutlined
                style={{
                  fontSize: 16,
                  color: isExhausted(stats.chat.remaining) ? '#9333EA' : '#8B5CF6',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>AI 聊天</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {stats.chat.quotaType === 'daily' ? '每日' : '每月'}限额 {stats.chat.quotaLimit} 次
              </div>
            </div>
          </div>
          <Space size={8}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B' }}>
              {stats.chat.used}
            </span>
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>/ {stats.chat.quotaLimit}</span>
            {isExhausted(stats.chat.remaining) && (
              <Tag color="error" style={{ margin: 0 }}>
                已用完
              </Tag>
            )}
            {isLow(stats.chat.remaining, stats.chat.quotaLimit) && (
              <Tag color="warning" style={{ margin: 0 }}>
                即将用完
              </Tag>
            )}
          </Space>
        </div>
        <Progress
          percent={percentage(stats.chat.used, stats.chat.quotaLimit)}
          strokeColor={
            isExhausted(stats.chat.remaining)
              ? '#EF4444'
              : isLow(stats.chat.remaining, stats.chat.quotaLimit)
                ? '#F59E0B'
                : '#8B5CF6'
          }
          trailColor="#F3F4F6"
          size="default"
          showInfo={false}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            已使用 {percentage(stats.chat.used, stats.chat.quotaLimit)}%
          </span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>剩余 {stats.chat.remaining} 次</span>
        </div>
      </div>
    </Card>
  );
}
