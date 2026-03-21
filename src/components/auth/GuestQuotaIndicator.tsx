// 游客配额指示器组件
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, Button, Space, Spin } from 'antd';
import { GiftOutlined } from '@ant-design/icons';

interface GuestQuota {
  remaining: number;
  limit: number;
  used: number;
  canProceed: boolean;
}

export function GuestQuotaIndicator() {
  const [quota, setQuota] = useState<GuestQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuota() {
      try {
        const response = await fetch('/api/guest/quota');
        const data = await response.json();
        if (data.success) {
          setQuota(data);
        }
      } catch (error) {
        console.error('Error fetching guest quota:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuota();
  }, []);

  if (loading) {
    return <Spin size="small" />;
  }

  if (!quota) {
    return null;
  }

  // 根据剩余次数确定颜色
  let color = 'blue';
  if (quota.remaining === 0) {
    color = 'red';
  } else if (quota.remaining === 1) {
    color = 'orange';
  }

  if (quota.remaining === 0) {
    return (
      <Space size={8}>
        <Tag icon={<GiftOutlined />} color={color}>
          已达体验上限
        </Tag>
        <Button type="primary" size="small">
          <Link href="/register">注册账户</Link>
        </Button>
      </Space>
    );
  }

  return (
    <Space size={8}>
      <Tag icon={<GiftOutlined />} color={color}>
        剩余 {quota.remaining} 次免费体验
      </Tag>
      {quota.remaining <= 1 && (
        <Button type="primary" size="small">
          <Link href="/register">注册账户</Link>
        </Button>
      )}
    </Space>
  );
}
