import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';

/**
 * 管理员权限检查 Hook
 *
 * 用于管理员页面的权限验证，确保用户已登录管理员账户
 *
 * @returns {Object} { adminToken, checking } - adminToken: 管理员令牌, checking: 是否正在检查权限
 */
export function useAdminAuth() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      message.warning('请先登录管理员账户');
      router.push('/admin');
      return;
    }
    setAdminToken(token);
    setChecking(false);
  }, [router]);

  return { adminToken, checking };
}
