import { createClient } from '@/lib/supabase/server';
import { DatabaseError, UnauthorizedError, ConflictError } from '@/lib/utils/errors';
import type { User } from '@supabase/supabase-js';

/**
 * 认证数据访问层
 * 封装所有认证相关的数据库操作
 */
export class AuthRepository {
  /**
   * 用户登录
   */
  async authenticate(email: string, password: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new UnauthorizedError('Invalid email or password');
        }
        throw new UnauthorizedError(error.message);
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedError('Login failed');
      }

      return {
        user: data.user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new DatabaseError('Failed to authenticate user');
    }
  }

  /**
   * 用户注册
   */
  async register(email: string, password: string): Promise<{
    user: User | null;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify-email`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new ConflictError('Email already registered');
        }
        throw new DatabaseError(`Registration failed: ${error.message}`);
      }

      return {
        user: data.user,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      };
    } catch (error) {
      if (error instanceof ConflictError || error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to register user');
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new DatabaseError(`Logout failed: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to logout');
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = await createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (error) {
        throw new DatabaseError(`Failed to send reset email: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to send password reset email');
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(newPassword: string): Promise<User> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new DatabaseError(`Failed to reset password: ${error.message}`);
      }

      if (!data.user) {
        throw new UnauthorizedError('Failed to reset password');
      }

      return data.user;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof UnauthorizedError) throw error;
      throw new DatabaseError('Failed to reset password');
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<User> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        throw new UnauthorizedError(`Email verification failed: ${error.message}`);
      }

      if (!data.user) {
        throw new UnauthorizedError('Email verification failed');
      }

      return data.user;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new DatabaseError('Failed to verify email');
    }
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify-email`,
        },
      });

      if (error) {
        throw new DatabaseError(`Failed to resend verification: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to resend verification email');
    }
  }

  /**
   * 刷新会话
   */
  async refreshSession(): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw new UnauthorizedError(`Session refresh failed: ${error.message}`);
      }

      if (!data.session) {
        throw new UnauthorizedError('Session refresh failed');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new DatabaseError('Failed to refresh session');
    }
  }

  /**
   * 检查邮箱是否已验证
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      return user.email_confirmed_at !== null;
    } catch {
      return false;
    }
  }

  /**
   * 创建登录日志
   */
  async createLoginLog(userId: string, ipAddress?: string): Promise<void> {
    try {
      const supabase = await createClient();

      // 如果有 user_security_log 表，记录登录日志
      await supabase.from('user_security_log').insert({
        user_id: userId,
        event_type: 'login',
        ip_address: ipAddress || null,
        success: true,
        created_at: new Date().toISOString(),
      }).catch(() => {
        // 表可能不存在，忽略错误
      });
    } catch {
      // 忽略日志错误
    }
  }
}
