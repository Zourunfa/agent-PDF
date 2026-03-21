/**
 * 密码重置功能集成测试
 * 测试忘记密码流程、邮件发送和密码重置
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createAdminClient } from '@/lib/supabase/admin';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('密码重置功能集成测试', () => {
  const supabase = createAdminClient();
  let testUser: { id: string; email: string };
  let testPassword = 'Test123456';

  beforeAll(async () => {
    // 创建测试用户
    const testEmail = `test-reset-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Test Reset User',
      },
    });

    if (error || !data.user) {
      throw new Error('Failed to create test user');
    }

    testUser = {
      id: data.user.id,
      email: data.user.email,
    };

    // 等待触发器创建 user_profile
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // 清理测试用户
    try {
      await supabase.auth.admin.deleteUser(testUser.id);
    } catch (error) {
      console.error('Failed to delete test user:', error);
    }
  });

  describe('POST /api/auth/forgot-password', () => {
    it('应该成功发送密码重置邮件（有效的邮箱）', async () => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('邮件');
    });

    it('应该返回成功消息（不存在的邮箱，防止枚举攻击）', async () => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      });

      const data = await response.json();

      // 为了安全，应该返回相同的成功消息
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_EMAIL');
    });

    it('应该拒绝空的邮箱', async () => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('应该触发限流（频繁请求）', async () => {
      // 快速发送多个请求
      const requests = Array(5).fill(null).map(() =>
        fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testUser.email,
          }),
        })
      );

      const responses = await Promise.all(requests);

      // 至少有一个请求应该被限流
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });

    it('应该生成并存储重置令牌', async () => {
      // 先请求重置
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });

      // 检查数据库中是否有令牌
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('password_reset_token, reset_expires_at')
        .eq('email', testUser.email)
        .single();

      expect(profile).toBeTruthy();
      expect(profile?.password_reset_token).toBeTruthy();
      expect(profile?.reset_expires_at).toBeTruthy();

      // 检查过期时间是否在未来
      const expiresAt = new Date(profile!.reset_expires_at!);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let validToken: string;

    beforeAll(async () => {
      // 获取有效的重置令牌
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });

      // 从数据库获取令牌
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('password_reset_token')
        .eq('email', testUser.email)
        .single();

      validToken = profile!.password_reset_token!;
    });

    it('应该成功重置密码（有效的令牌）', async () => {
      const newPassword = 'NewPassword123';

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: validToken,
          newPassword,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('成功');

      // 验证可以使用新密码登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: newPassword,
      });

      expect(signInError).toBeNull();
      expect(signInData.user).toBeTruthy();

      // 更新测试密码以便后续清理
      testPassword = newPassword;
    });

    it('应该拒绝无效的令牌', async () => {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'invalid-token-uuid',
          newPassword: 'NewPassword123',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_TOKEN');
    });

    it('应该拒绝弱密码', async () => {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: validToken,
          newPassword: 'weak',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('WEAK_PASSWORD');
    });

    it('应该清除已使用的令牌', async () => {
      // 生成新令牌
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('password_reset_token')
        .eq('email', testUser.email)
        .single();

      const token = profile!.password_reset_token!;

      // 使用令牌
      await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: 'NewPassword456',
        }),
      });

      // 检查令牌是否已清除
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('password_reset_token')
        .eq('email', testUser.email)
        .single();

      expect(updatedProfile?.password_reset_token).toBeNull();
    });

    it('应该记录安全日志', async () => {
      // 生成新令牌并重置密码
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('password_reset_token')
        .eq('email', testUser.email)
        .single();

      await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: profile!.password_reset_token,
          newPassword: 'NewPassword789',
        }),
      });

      // 检查安全日志
      const { data: logs } = await supabase
        .from('user_security_log')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('event_type', 'password_reset');

      expect(logs).toBeTruthy();
      expect(logs!.length).toBeGreaterThan(0);
      expect(logs![0].success).toBe(true);
    });
  });
});
