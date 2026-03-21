/**
 * User Stats Component - Ant Design Modern
 * 用户统计数据组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Tag, Button, Empty, Spin, Alert, Space } from 'antd';
import {
  FileTextOutlined,
  MessageOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { apiGet } from '@/lib/utils/api-fetch';

interface UserStatsData {
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

export function UserStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ data: UserStatsData }>('/api/user/stats');

      if (!data.success) {
        throw new Error(data.message || '获取统计数据失败');
      }

      setStats(data.data);
    } catch (err: any) {
      setError(err.message || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getActivityIcon = (type: string) => {
    if (type.includes('upload') || type.includes('pdf')) {
      return <FileTextOutlined style={{ color: '#6366F1' }} />;
    }
    return <MessageOutlined style={{ color: '#8B5CF6' }} />;
  };

  const getActivityText = (type: string) => {
    if (type.includes('upload') || type.includes('pdf')) {
      return '上传 PDF';
    }
    return 'AI 聊天';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      return '刚刚';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button icon={<ReloadOutlined />} onClick={fetchStats}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const hasData = stats.total.uploads > 0 || stats.total.chats > 0;

  return (
    <div style={{ padding: 32 }}>
      {/* 页面标题和刷新按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8, color: '#1E1B4B' }}
          >
            使用统计
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>查看您的使用情况和历史趋势</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
          刷新数据
        </Button>
      </div>

      {!hasData ? (
        // 空状态
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          imageStyle={{
            height: 60,
          }}
          description={
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>暂无使用记录</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>开始上传 PDF 和使用 AI 聊天功能吧！</p>
            </div>
          }
        />
      ) : (
        <>
          {/* 总统计和今日统计 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  border: 'none',
                  borderRadius: 12,
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>总上传 PDF</span>
                  }
                  value={stats.total.uploads}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                  border: 'none',
                  borderRadius: 12,
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>总 AI 聊天</span>
                  }
                  value={stats.total.chats}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* 今日统计 */}
          <Card
            title={
              <Space>
                <TrophyOutlined />
                <span>今日使用</span>
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 12 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="今日上传"
                  value={stats.today.uploads}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#6366F1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日聊天"
                  value={stats.today.chats}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#8B5CF6' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 历史趋势 */}
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>最近 7 天趋势</span>
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 12 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: 200,
                gap: 8,
              }}
            >
              {stats.history.map((day, index) => {
                const maxValue = Math.max(
                  ...stats.history.map((d) => Math.max(d.uploads, d.chats)),
                  1
                );
                const uploadHeight = (day.uploads / maxValue) * 100;
                const chatHeight = (day.chats / maxValue) * 100;

                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#9CA3AF',
                        textAlign: 'center',
                      }}
                    >
                      {new Date(day.date).toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 2,
                        height: 150,
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: `${uploadHeight}%`,
                          background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s',
                          position: 'relative',
                        }}
                        title={`上传: ${day.uploads}`}
                      />
                      <div
                        style={{
                          flex: 1,
                          height: `${chatHeight}%`,
                          background: 'linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s',
                        }}
                        title={`聊天: ${day.chats}`}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>{day.uploads + day.chats}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
              <Space size={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: '#6366F1', borderRadius: 2 }} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>上传</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: '#8B5CF6', borderRadius: 2 }} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>聊天</span>
                </div>
              </Space>
            </div>
          </Card>

          {/* 最近活动 */}
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>最近活动</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <List
              dataSource={stats.recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getActivityIcon(item.type)}
                    title={getActivityText(item.type)}
                    description={
                      <Space split={<span style={{ color: '#D1D5DB' }}>•</span>}>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>
                          {formatTime(item.timestamp)}
                        </span>
                        <Tag color={item.type.includes('upload') ? 'blue' : 'purple'}>
                          {item.amount} 次
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无活动记录" />
                ),
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
