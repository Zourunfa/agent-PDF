/**
 * Skeleton Loading Components
 * 骨架屏加载组件
 */

'use client';

import React from 'react';
import { Card, Skeleton, Space, Descriptions } from 'antd';

/**
 * 用户资料页面骨架屏
 */
export function UserProfileSkeleton() {
  return (
    <div style={{ padding: 32 }}>
      {/* 头像区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
        <Skeleton.Avatar active size={100} style={{ borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 12 }} />
          <Skeleton.Input active size="small" style={{ width: 300 }} />
        </div>
      </div>

      {/* 邮箱验证状态 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 12 }} />
        <Skeleton.Input active size="small" style={{ width: 120 }} />
      </Card>

      {/* 用户名编辑表单 */}
      <Card title={<Skeleton.Input active size="small" style={{ width: 100 }} />} style={{ borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
            <Skeleton.Input active style={{ width: '100%' }} />
          </div>
          <Skeleton.Button active size="large" style={{ width: 120 }} />
        </Space>
      </Card>
    </div>
  );
}

/**
 * 密码修改页面骨架屏
 */
export function PasswordChangeSkeleton() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 32, display: 'block', marginInline: 'auto' }} />

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
            <Skeleton.Input active style={{ width: '100%' }} />
          </div>
          <div>
            <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
            <Skeleton.Input active style={{ width: '100%' }} />
          </div>
          <div>
            <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 8 }} />
            <Skeleton.Input active style={{ width: '100%' }} />
          </div>
          <Skeleton.Button active size="large" style={{ width: 120, display: 'block', margin: '24px auto 0' }} />
        </Space>
      </div>
    </div>
  );
}

/**
 * 统计页面骨架屏
 */
export function UserStatsSkeleton() {
  return (
    <div style={{ padding: 32 }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} style={{ borderRadius: 12 }}>
            <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 12 }} />
            <Skeleton.Input active size="large" style={{ width: 120 }} />
          </Card>
        ))}
      </div>

      {/* 趋势图表 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 16 }} />
        <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton.Input active style={{ width: '100%', height: `${50 + Math.random() * 100}px` }} />
            </div>
          ))}
        </div>
      </Card>

      {/* 最近活动 */}
      <Card style={{ borderRadius: 12 }}>
        <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 16 }} />
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 16 }}>
              <Skeleton.Avatar active size={40} />
              <div style={{ flex: 1 }}>
                <Skeleton.Input active size="small" style={{ width: 200, marginBottom: 4 }} />
                <Skeleton.Input active size="small" style={{ width: 120 }} />
              </div>
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
}
