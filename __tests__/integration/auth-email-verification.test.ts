/**
 * 邮箱验证功能集成测试
 * 测试邮箱验证流程和重新发送验证邮件
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createAdminClient } from '@/lib/supabase/admin';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('邮箱验证功能集成测试', () => {
  const supabase = createAdminClient();
  let testUser: { id: string; email: string };
  let testPassword = 'Test123456';
  let authToken: string;

  beforeAll(async () => {
    // 创建测试用户（未验证）
    const testEmail = `test-verify-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false, // 不自动验证
      user_metadata: {
        name: 'Test Verify User',
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

    // 生成验证令牌
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase
      .from('user_profiles')
      .update({
        email_verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString(),
        email_verified: false,
      })
      .eq('id', testUser.id);

    // 登录获取认证令牌
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInData.session) {
      authToken = signInData.session.access_token;
    }
  });

  afterAll(async () => {
    // 清理测试用户
    try {
      await supabase.auth.admin.deleteUser(testUser.id);
    } catch (error) {
      console.error('Failed to delete test user:', error);
    }
  });

  describe('POST /api/auth/verify-email', () => {
    let validToken: string;

    beforeAll(async () => {
      // 获取有效的验证令牌
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email_verification_token')
        .eq('id', testUser.id)
        .single();

      validToken = profile!.email_verification_token!;
    });

    it('应该成功验证邮箱（有效的令牌）', async () => {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: validToken,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('成功');

      // 验证数据库中的状态
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email_verified, email_verification_token')
        .eq('id', testUser.id)
        .single();

      expect(profile?.email_verified).toBe(true);
      expect(profile?.email_verification_token).toBeNull();
    });

    it('应该拒绝无效的验证令牌', async () => {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'invalid-token-uuid',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_TOKEN');
    });

    it('应该拒绝空的验证令牌', async () => {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
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

    it('应该记录安全日志', async () => {
      // 创建新用户进行测试
      const testEmail2 = `test-verify-log-${Date.now()}@example.com`;
      const { data: newUser } = await supabase.auth.admin.createUser({
        email: testEmail2,
        password: 'Test123456',
        email_confirm: false,
      });

      if (newUser.user) {
        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await supabase
          .from('user_profiles')
          .update({
            email_verification_token: verificationToken,
            verification_expires_at: expiresAt.toISOString(),
          })
          .eq('id', newUser.user.id);

        // 验证邮箱
        await fetch(`${API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: verificationToken,
          }),
        });

        // 检查安全日志
        const { data: logs } = await supabase
          .from('user_security_log')
          .select('*')
          .eq('user_id', newUser.user.id)
          .eq('event_type', 'email_verified');

        expect(logs).toBeTruthy();
        expect(logs!.length).toBeGreaterThan(0);

        // 清理
        await supabase.auth.admin.deleteUser(newUser.user.id);
      }
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    let unverifiedUser: { id: string; email: string };
    let userAuthToken: string;

    beforeAll(async () => {
      // 创建未验证的用户
      const testEmail = `test-resend-${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'Test123456',
        email_confirm: false,
        user_metadata: {
          name: 'Test Resend User',
        },
      });

      if (error || !data.user) {
        throw new Error('Failed to create unverified test user');
      }

      unverifiedUser = {
        id: data.user.id,
        email: data.user.email,
      };

      // 登录获取令牌
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'Test123456',
      });

      if (signInData.session) {
        userAuthToken = signInData.session.access_token;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
      // 清理测试用户
      try {
        await supabase.auth.admin.deleteUser(unverifiedUser.id);
      } catch (error) {
        console.error('Failed to delete unverified test user:', error);
      }
    });

    it('应该成功重新发送验证邮件（已登录用户）', async () => {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userAuthToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('邮件');
    });

    it('应该拒绝未认证用户的请求', async () => {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('应该拒绝已验证用户的请求', async () => {
      // 将测试用户标记为已验证
      await supabase
        .from('user_profiles')
        .update({ email_verified: true })
        .eq('id', unverifiedUser.id);

      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userAuthToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ALREADY_VERIFIED');

      // 恢复未验证状态
      await supabase
        .from('user_profiles')
        .update({ email_verified: false })
        .eq('id', unverifiedUser.id);
    });

    it('应该生成新的验证令牌', async () => {
      const { data: beforeProfile } = await supabase
        .from('user_profiles')
        .select('email_verification_token')
        .eq('id', unverifiedUser.id)
        .single();

      const oldToken = beforeProfile?.email_verification_token;

      // 重新发送
      await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userAuthToken}`,
        },
      });

      // 检查令牌是否更新
      const { data: afterProfile } = await supabase
        .from('user_profiles')
        .select('email_verification_token')
        .eq('id', unverifiedUser.id)
        .single();

      expect(afterProfile?.email_verification_token).toBeTruthy();
      expect(afterProfile?.email_verification_token).not.toBe(oldToken);
    });

    it('应该触发限流（频繁请求）', async () => {
      // 快速发送多个请求
      const requests = Array(6).fill(null).map(() =>
        fetch(`${API_URL}/api/auth/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userAuthToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);

      // 至少有一个请求应该被限流
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('GET /api/auth/verify-email (从邮件链接)', () => {
    it('应该通过 GET 请求处理验证（重定向）', async () => {
      // 创建新用户
      const testEmail = `test-verify-get-${Date.now()}@example.com`;
      const { data: newUser } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'Test123456',
        email_confirm: false,
      });

      if (newUser.user) {
        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await supabase
          .from('user_profiles')
          .update({
            email_verification_token: verificationToken,
            verification_expires_at: expiresAt.toISOString(),
          })
          .eq('id', newUser.user.id);

        // 使用 GET 请求
        const response = await fetch(
          `${API_URL}/api/auth/verify-email?token=${verificationToken}`,
          {
            redirect: 'manual', // 不自动跟随重定向
          }
        );

        // 应该返回重定向响应
        expect([301, 302, 303, 307, 308]).toContain(response.status);

        // 清理
        await supabase.auth.admin.deleteUser(newUser.user.id);
      }
    });

    it('应该处理缺少令牌的 GET 请求', async () => {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        redirect: 'manual',
      });

      expect([301, 302, 303, 307, 308]).toContain(response.status);

      const location = response.headers.get('location');
      expect(location).toContain('error=missing_token');
    });
  });
});
