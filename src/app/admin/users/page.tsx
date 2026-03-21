/**
 * Admin Users Management Page
 * 管理员用户管理页面
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Card,
  Statistic,
  Row,
  Col,
  Select,
  Typography,
  Dropdown,
  Input,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LogoutOutlined,
  UserOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

const { Title, Text } = Typography;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  hasProfile: boolean;
  createdAt: string;
  lastSigninAt: string | null;
  pdfCount: number;
}

const UserRoleColors: Record<string, string> = {
  admin: 'red',
  user: 'blue',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // 检查管理员登录状态
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      message.warning('请先登录');
      router.push('/admin');
      return;
    }
    setAdminToken(token);
    fetchUsers();
  }, [router]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch('/api/admin/users', {
        headers: {
          'X-Admin-Token': token || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
      } else {
        if (response.status === 403) {
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('adminToken');
          router.push('/admin');
        } else {
          message.error('获取用户列表失败');
        }
      }
    } catch (error) {
      console.error('[Admin Users] Error:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string, username: string) => {
    console.log('[Admin Delete User] 前端准备删除用户:', {
      userId,
      userIdType: typeof userId,
      username,
    });

    // 乐观删除：立即从前端列表中移除
    const previousUsers = [...users];
    setUsers(users.filter((u) => u.id !== userId));

    try {
      const token = localStorage.getItem('adminToken');

      console.log('[Admin Delete User] 发送删除请求到:', `/api/admin/users/${userId}`);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': token || '',
        },
      });

      const data = await response.json();

      console.log('[Admin Delete User] 服务器响应:', data);

      if (data.success || response.status === 404) {
        // 404 表示用户不存在，可能已经被删除了
        message.success(data.message || `用户 "${username}" 已删除`);
        // 刷新列表以确保数据同步
        await fetchUsers();
      } else {
        // 删除失败，恢复列表
        setUsers(previousUsers);
        message.error(data.error?.message || '删除失败');
      }
    } catch (error) {
      // 删除失败，恢复列表
      setUsers(previousUsers);
      console.error('[Admin Delete] Error:', error);
      message.error('删除失败');
    }
  };

  // 更新用户角色
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('角色已更新');
        fetchUsers(); // 刷新列表
      } else {
        message.error(data.error?.message || '更新失败');
      }
    } catch (error) {
      console.error('[Admin Update] Error:', error);
      message.error('更新失败');
    }
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    message.success('已退出登录');
    router.push('/admin');
  };

  // 过滤用户
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text, record) => (
        <Space>
          <Text copyable style={{ fontSize: 12 }}>
            {text || '-'}
          </Text>
          {!record.emailVerified && (
            <Tag color="warning" style={{ fontSize: 11 }}>
              未验证
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '普通用户', value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 100 }}
          onChange={(value) => handleUpdateRole(record.id, value)}
          options={[
            { label: '管理员', value: 'admin' },
            { label: '用户', value: 'user' },
          ]}
        />
      ),
    },
    {
      title: 'PDF 数量',
      dataIndex: 'pdfCount',
      key: 'pdfCount',
      render: (count) => (
        <Tag icon={<FileTextOutlined />} color="blue">
          {count}
        </Tag>
      ),
      sorter: (a, b) => a.pdfCount - b.pdfCount,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Text style={{ fontSize: 12 }}>{new Date(date).toLocaleString('zh-CN')}</Text>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '最后登录',
      dataIndex: 'lastSigninAt',
      key: 'lastSigninAt',
      render: (date) => (
        <Text style={{ fontSize: 12 }}>
          {date ? new Date(date).toLocaleString('zh-CN') : '从未登录'}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description={`确定要删除用户 "${record.username}" 吗？这将同时删除其所有数据。`}
          onConfirm={() => handleDeleteUser(record.id, record.username)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    users: users.filter((u) => u.role === 'user').length,
    unverified: users.filter((u) => !u.emailVerified).length,
    totalPDFs: users.reduce((sum, u) => sum + u.pdfCount, 0),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: 24 }}>
      {/* Header */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <UserOutlined /> 用户管理
            </Title>
            <Text type="secondary">管理系统用户和权限</Text>
          </div>
          <Space>
            <Button icon={<SearchOutlined />}>搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              刷新
            </Button>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              退出
            </Button>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={5}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="管理员" value={stats.admins} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic title="普通用户" value={stats.users} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="未验证邮箱"
              value={stats.unverified}
              valueStyle={{ color: stats.unverified > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总 PDF 数"
              value={stats.totalPDFs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Input
          placeholder="搜索用户名或邮箱..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </Card>

      {/* Users Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 个用户`,
            showSizeChanger: true,
          }}
        />
      </Card>
    </div>
  );
}
