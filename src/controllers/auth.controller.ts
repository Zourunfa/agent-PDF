import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse } from '@/lib/utils/response';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema, VerifyEmailSchema } from '@/dtos/auth.dto';

/**
 * 认证控制器
 * 处理认证相关的 HTTP 请求
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/v1/auth/login - 用户登录
   */
  async login(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validated = LoginSchema.parse(body);

      const result = await this.authService.login(validated);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/auth/register - 用户注册
   */
  async register(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validated = RegisterSchema.parse(body);

      const result = await this.authService.register(validated);

      return successResponse(result, 201);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/auth/logout - 用户登出
   */
  async logout(): Promise<NextResponse> {
    try {
      await this.authService.logout();

      return successResponse({ message: 'Logged out successfully' });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/auth/me - 获取当前用户信息
   */
  async me(): Promise<NextResponse> {
    try {
      const user = await this.authService.getCurrentUser();

      return successResponse({ user });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password - 忘记密码
   */
  async forgotPassword(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validated = ForgotPasswordSchema.parse(body);

      const result = await this.authService.forgotPassword(validated.email);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password - 重置密码
   */
  async resetPassword(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validated = ResetPasswordSchema.parse(body);

      const result = await this.authService.resetPassword(validated.password);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-email - 验证邮箱
   */
  async verifyEmail(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validated = VerifyEmailSchema.parse(body);

      const result = await this.authService.verifyEmail(validated.token);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/auth/resend-verification - 重新发送验证邮件
   */
  async resendVerification(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { email } = body;

      const result = await this.authService.resendVerification(email);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }
}
