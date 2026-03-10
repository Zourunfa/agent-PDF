'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Popover,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  MessageOutlined,
  DownloadOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  WechatOutlined,
} from '@ant-design/icons';

const { Content } = Layout;

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  features: {
    name: string;
    included: boolean;
  }[];
  cta: string;
  highlighted?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久免费',
    description: '适合个人用户体验',
    icon: <FileTextOutlined />,
    features: [
      { name: '每天 5 次免费体验', included: true },
      { name: '支持 PDF 上传和分析', included: true },
      { name: '基础 AI 对话功能', included: true },
      { name: '文档保存（7天）', included: true },
      { name: '优先支持', included: false },
      { name: '批量处理', included: false },
      { name: 'API 接口', included: false },
      { name: '团队协作', included: false },
    ],
    cta: '开始使用',
  },
  {
    id: 'pro',
    name: '专业版',
    price: 12,
    period: '每月',
    description: '适合专业人士和小团队',
    icon: <ThunderboltOutlined />,
    badge: '最受欢迎',
    highlighted: true,
    features: [
      { name: '无限次数使用', included: true },
      { name: '支持 PDF 上传和分析', included: true },
      { name: '高级 AI 对话功能', included: true },
      { name: '文档永久保存', included: true },
      { name: '优先支持', included: true },
      { name: '批量处理（100个/天）', included: true },
      { name: 'API 接口', included: false },
      { name: '团队协作（3人）', included: true },
    ],
    cta: '升级到专业版',
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 100,
    period: '每年',
    description: '适合大型团队和企业',
    icon: <CrownOutlined />,
    features: [
      { name: '无限次数使用', included: true },
      { name: '支持 PDF 上传和分析', included: true },
      { name: '企业级 AI 对话功能', included: true },
      { name: '文档永久保存', included: true },
      { name: '24/7 专属支持', included: true },
      { name: '批量处理（无限）', included: true },
      { name: 'API 接口（无限）', included: true },
      { name: '团队协作（无限）', included: true },
    ],
    cta: '联系销售',
  },
];

const comparisonFeatures = [
  { key: 'storage', label: '文档存储', icon: <FileTextOutlined /> },
  { key: 'chat', label: 'AI 对话', icon: <MessageOutlined /> },
  { key: 'export', label: '导出功能', icon: <DownloadOutlined /> },
  { key: 'team', label: '团队协作', icon: <TeamOutlined /> },
  { key: 'api', label: 'API 接口', icon: <ThunderboltOutlined /> },
  { key: 'support', label: '技术支持', icon: <TeamOutlined /> },
];

// 微信二维码悬浮内容
const wechatPopoverContent = (
  <div style={{ textAlign: 'center' }}>
    <img
      src="/images/weixin.jpg"
      alt="微信二维码"
      style={{
        width: 200,
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3E微信二维码%3C/text%3E%3C/svg%3E';
      }}
    />
    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
      扫描二维码添加微信
    </p>
    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#999' }}>
      获取专业版优惠
    </p>
  </div>
);

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, isPremium } = useAuth();
  const [proPopoverOpen, setProPopoverOpen] = useState(false);
  const [enterprisePopoverOpen, setEnterprisePopoverOpen] = useState(false);

  const handleUpgrade = (planId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (planId === 'pro') {
      setProPopoverOpen(true);
      return;
    }

    if (planId === 'enterprise') {
      setEnterprisePopoverOpen(true);
      return;
    }

    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <Content style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 页面标题 */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, marginBottom: 16 }}>
              简单透明的定价
            </h1>
            <p style={{ fontSize: 16, color: '#666', margin: 0, marginBottom: 24 }}>
              选择适合您的计划，开始使用 PDF AI Chat
            </p>

            {/* 计费周期切换 */}
            <Space size="large">
              <Tag color="blue">按月计费</Tag>
              <span style={{ fontSize: 13, color: '#999' }}>
                年度计费仅需 ¥100，相当于每月 ¥8.33
              </span>
            </Space>
          </div>

          {/* 当前用户提示 */}
          {isAuthenticated && isPremium && (
            <Alert
              message="您已是高级用户"
              description="感谢您的支持！您可以随时升级到企业版获得更多功能。"
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              style={{ marginBottom: 32 }}
            />
          )}

          {/* 定价卡片 */}
          <Row gutter={[24, 24]} style={{ marginBottom: 64 }}>
            {pricingPlans.map((plan) => (
              <Col xs={24} sm={12} lg={8} key={plan.id}>
                <Card
                  hoverable={!plan.highlighted}
                  style={{
                    height: '100%',
                    borderRadius: 12,
                    border: plan.highlighted
                      ? '2px solid #6366F1'
                      : '1px solid #E5E7EB',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  bodyStyle={{ padding: 32 }}
                >
                  {/* 推荐标签 */}
                  {plan.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#fff',
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: '0 12px 0 12px',
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* 计划名称和图标 */}
                  <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 32,
                        marginBottom: 12,
                        color: plan.highlighted ? '#6366F1' : '#666',
                      }}
                    >
                      {plan.icon}
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8 }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: 13, color: '#999', margin: 0 }}>
                      {plan.description}
                    </p>
                  </div>

                  {/* 价格 */}
                  <div
                    style={{
                      textAlign: 'center',
                      marginBottom: 24,
                      paddingBottom: 24,
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                      {plan.period}
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 800, margin: 0 }}>
                      ¥{plan.price}
                      <span style={{ fontSize: 16, color: '#999', fontWeight: 400 }}>
                        {plan.price > 0 ? `/${plan.period.split('每')[1]}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* 功能列表 */}
                  <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                        }}
                      >
                        {feature.included ? (
                          <CheckCircleOutlined style={{ color: '#10B981', flexShrink: 0 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#D1D5DB', flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            color: feature.included ? '#333' : '#999',
                            textDecoration: feature.included ? 'none' : 'line-through',
                          }}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </Space>

                  {/* CTA 按钮 */}
                  {plan.id === 'pro' ? (
                    <Popover
                      content={wechatPopoverContent}
                      title="扫描微信二维码"
                      trigger="click"
                      open={proPopoverOpen}
                      onOpenChange={setProPopoverOpen}
                      placement="top"
                    >
                      <Button
                        type={plan.highlighted ? 'primary' : 'default'}
                        size="large"
                        block
                        style={{
                          height: 44,
                          borderRadius: 8,
                          fontWeight: 600,
                          background: plan.highlighted
                            ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                            : undefined,
                          borderColor: plan.highlighted ? 'transparent' : undefined,
                        }}
                      >
                        {plan.cta}
                        <WechatOutlined style={{ marginLeft: 8 }} />
                      </Button>
                    </Popover>
                  ) : plan.id === 'enterprise' ? (
                    <Popover
                      content={wechatPopoverContent}
                      title="扫描微信二维码"
                      trigger="click"
                      open={enterprisePopoverOpen}
                      onOpenChange={setEnterprisePopoverOpen}
                      placement="top"
                    >
                      <Button
                        type={plan.highlighted ? 'primary' : 'default'}
                        size="large"
                        block
                        style={{
                          height: 44,
                          borderRadius: 8,
                          fontWeight: 600,
                          background: plan.highlighted
                            ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                            : undefined,
                          borderColor: plan.highlighted ? 'transparent' : undefined,
                        }}
                      >
                        {plan.cta}
                        <WechatOutlined style={{ marginLeft: 8 }} />
                      </Button>
                    </Popover>
                  ) : (
                    <Button
                      type={plan.highlighted ? 'primary' : 'default'}
                      size="large"
                      block
                      style={{
                        height: 44,
                        borderRadius: 8,
                        fontWeight: 600,
                        background: plan.highlighted
                          ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                          : undefined,
                        borderColor: plan.highlighted ? 'transparent' : undefined,
                      }}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.cta}
                      <ArrowRightOutlined style={{ marginLeft: 8 }} />
                    </Button>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          {/* 功能对比表 */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
              功能对比
            </h2>

            <Card style={{ borderRadius: 12 }}>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#333',
                        }}
                      >
                        功能
                      </th>
                      {pricingPlans.map((plan) => (
                        <th
                          key={plan.id}
                          style={{
                            padding: '16px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: '#333',
                            background: plan.highlighted ? '#F5F3FF' : 'transparent',
                          }}
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, idx) => (
                      <tr
                        key={feature.key}
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          background: idx % 2 === 0 ? '#FAFBFC' : 'transparent',
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            fontWeight: 500,
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 16, color: '#6366F1' }}>
                            {feature.icon}
                          </span>
                          {feature.label}
                        </td>
                        {pricingPlans.map((plan) => {
                          const featureData = plan.features.find(
                            (f) => f.name.includes(feature.label) || f.name.includes(feature.key)
                          );
                          return (
                            <td
                              key={plan.id}
                              style={{
                                padding: '16px',
                                textAlign: 'center',
                                background: plan.highlighted ? '#F5F3FF' : 'transparent',
                              }}
                            >
                              {featureData?.included ? (
                                <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />
                              ) : (
                                <CloseCircleOutlined style={{ color: '#D1D5DB', fontSize: 16 }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* FAQ 部分 */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
              常见问题
            </h2>

            <Row gutter={[24, 24]}>
              {[
                {
                  q: '可以随时升级或降级吗？',
                  a: '是的，您可以随时升级或降级您的计划。升级立即生效，降级将在下个计费周期生效。',
                },
                {
                  q: '支持哪些付款方式？',
                  a: '我们支持支付宝、微信支付、银行卡等多种付款方式。',
                },
                {
                  q: '有免费试用期吗？',
                  a: '免费版本提供每天 5 次免费体验，无需信用卡即可开始使用。',
                },
                {
                  q: '企业版有什么优势？',
                  a: '企业版提供无限使用、24/7 专属支持、API 接口和团队协作功能。',
                },
              ].map((item, idx) => (
                <Col xs={24} sm={12} key={idx}>
                  <Card style={{ borderRadius: 12, height: '100%' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                      {item.q}
                    </h4>
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                      {item.a}
                    </p>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* 底部 CTA */}
          <div
            style={{
              textAlign: 'center',
              padding: '48px 32px',
              background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
              borderRadius: 16,
              border: '1px solid rgba(99, 102, 241, 0.1)',
            }}
          >
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
              准备好开始了吗？
            </h2>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
              选择适合您的计划，立即开始使用 PDF AI Chat
            </p>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                style={{
                  height: 44,
                  paddingLeft: 32,
                  paddingRight: 32,
                  borderRadius: 8,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderColor: 'transparent',
                }}
                onClick={() => handleUpgrade('pro')}
              >
                升级到专业版
              </Button>
              <Button
                size="large"
                style={{
                  height: 44,
                  paddingLeft: 32,
                  paddingRight: 32,
                  borderRadius: 8,
                  fontWeight: 600,
                }}
                onClick={() => router.push('/')}
              >
                返回首页
              </Button>
            </Space>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
