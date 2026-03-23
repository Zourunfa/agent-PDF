'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function TestDeletePage() {
  const [email, setEmail] = useState('wangfengaf@gmail.com');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 管理员认证信息（从 .env.example）
  const adminAuth = btoa('admin:aa123321');

  const searchAndDeleteUser = async () => {
    if (!email) {
      alert('请输入邮箱');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      // 步骤1: 搜索用户
      setStatus({ type: 'info', message: '正在搜索用户...', time: new Date().toLocaleTimeString() });

      const searchRes = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Basic ${adminAuth}`,
        },
      });

      const searchData = await searchRes.json();

      if (!searchRes.ok || !searchData.success) {
        throw new Error(searchData.error?.message || '搜索失败');
      }

      if (!searchData.data || searchData.data.length === 0) {
        setStatus({ type: 'error', message: '未找到该邮箱的用户', time: new Date().toLocaleTimeString() });
        setLoading(false);
        return;
      }

      const user = searchData.data[0];
      setStatus({
        type: 'found',
        message: `找到用户: ${user.name || user.email}`,
        data: user,
        time: new Date().toLocaleTimeString()
      });

      // 确认删除
      if (!confirm(`确定要删除用户 "${user.name || user.email}" 吗？`)) {
        setStatus({ type: 'cancelled', message: '已取消删除', time: new Date().toLocaleTimeString() });
        setLoading(false);
        return;
      }

      // 步骤2: 删除用户
      setStatus({ type: 'info', message: '正在删除用户...', time: new Date().toLocaleTimeString() });

      const deleteRes = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${adminAuth}`,
        },
      });

      const deleteData = await deleteRes.json();

      if (!deleteRes.ok || !deleteData.success) {
        throw new Error(deleteData.error?.message || '删除失败');
      }

      setStatus({
        type: 'success',
        message: '✓ 用户删除成功',
        data: { deletedUser: user, response: deleteData },
        time: new Date().toLocaleTimeString()
      });

    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || '操作失败',
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const listAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Basic ${adminAuth}`,
        },
      });
      const data = await res.json();
      setStatus({
        type: 'list',
        message: `共 ${data.data?.length || 0} 个用户`,
        data,
        time: new Date().toLocaleTimeString()
      });
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message, time: new Date().toLocaleTimeString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        <h1>🗑️ 删除用户工具</h1>

      <div style={{ background: '#f0f9ff', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>通过邮箱删除用户</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入用户邮箱"
            style={{
              flex: 1,
              padding: 10,
              fontSize: 14,
              border: '1px solid #d1d5db',
              borderRadius: 4
            }}
          />
          <button
            onClick={searchAndDeleteUser}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              backgroundColor: loading ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '处理中...' : '搜索并删除'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={listAllUsers}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          列出所有用户
        </button>
      </div>

      {status && (
        <div style={{
          background: status.type === 'error' ? '#fef2f2' :
                   status.type === 'success' ? '#f0fdf4' :
                   '#f9fafb',
          padding: 15,
          borderRadius: 8,
          border: `1px solid ${
            status.type === 'error' ? '#fecaca' :
            status.type === 'success' ? '#bbf7d0' :
            '#e5e7eb'
          }`
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            {status.message}
          </p>
          <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: 12 }}>
            时间: {status.time}
          </p>
          {status.data && (
            <pre style={{
              background: 'white',
              padding: 10,
              borderRadius: 4,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 400
            }}>
              {JSON.stringify(status.data, null, 2)}
            </pre>
          )}
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
