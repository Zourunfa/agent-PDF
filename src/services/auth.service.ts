import { AuthRepository } from '@/repositories/auth.repository';
import { UserRepository } from '@/repositories/user.repository';
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from '@/lib/utils/errors';
import type { LoginDTO, RegisterDTO, LoginResult, RegisterResult } from '@/dtos/auth.dto';
import type { User } from '@supabase/supabase-js';

/**
 * 认证服务
 * 处理用户认证相关的业务逻辑
 */
export class AuthService {
  constructor(
    private authRepo: AuthRepository = new AuthRepository(),
    private userRepo: UserRepository = new UserRepository()
  ) {}

  /**
   * 用户登录
   */
  async login(dto: LoginDTO): Promise<LoginResult> {
    // 1. 验证用户凭证
    const { user, accessToken } = await this.authRepo.authenticate(
      dto.email,
      dto.password
    );

    // 2. 获取用户资料
    const profile = await this.userRepo.findById(user.id);

    // 3. 记录登录日志（异步，不阻塞响应）
    this.authRepo.createLoginLog(user.id).catch(() => {
      // 忽略日志错误
    });

    // 4. 返回登录结果
    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: profile?.name || null,
        avatarUrl: profile?.avatarUrl || null,
        role: profile?.role || 'user',
      },
      token: accessToken,
    };
  }

  /**
   * 用户注册
   */
  async register(dto: RegisterDTO): Promise<RegisterResult> {
    // 1. 检查邮箱是否已注册
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // 2. 创建 Supabase Auth 用户
    const { user } = await this.authRepo.register(dto.email, dto.password);

    if (!user) {
      throw new ValidationError('Registration failed. Please try again.');
    }

    // 3. 创建用户资料
    await this.userRepo.create(
      user.id,
      dto.email,
      dto.name
    );

    // 4. 返回注册结果
    return {
      userId: user.id,
      email: dto.email,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await this.authRepo.logout();
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<{
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    emailVerified: boolean;
  } | null> {
    const user = await this.authRepo.getCurrentUser();
    if (!user) return null;

    const profile = await this.userRepo.findById(user.id);

    return {
      id: user.id,
      email: user.email || '',
      name: profile?.name || null,
      avatarUrl: profile?.avatarUrl || null,
      role: profile?.role || 'user',
      emailVerified: user.email_confirmed_at !== null,
    };
  }

  /**
   * 发送密码重置邮件
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    await this.authRepo.sendPasswordResetEmail(email);

    return {
      message: 'Password reset email sent. Please check your inbox.',
    };
  }

  /**
   * 重置密码
   */
  async resetPassword(newPassword: string): Promise<{ message: string }> {
    await this.authRepo.resetPassword(newPassword);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<{ message: string; verified: boolean }> {
    const user = await this.authRepo.verifyEmail(token);

    // 更新用户资料的邮箱验证状态
    await this.userRepo.updateEmailVerified(user.id, true);

    return {
      message: 'Email verified successfully.',
      verified: true,
    };
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    await this.authRepo.resendVerificationEmail(email);

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  /**
   * 检查用户是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.authRepo.getCurrentUser();
    return user !== null;
  }

  /**
   * 检查用户是否为管理员
   */
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;
    return user.role === 'admin';
  }
}
