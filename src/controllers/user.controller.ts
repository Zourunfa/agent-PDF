import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse } from '@/lib/utils/response';
import { UpdateProfileSchema, ChangePasswordSchema } from '@/dtos/user.dto';
import { UnauthorizedError } from '@/lib/utils/errors';

/**
 * 用户控制器
 * 处理用户资料、统计、头像等相关的 HTTP 请求
 */
export class UserController {
  private userService: UserService;
  private authService: AuthService;

  constructor() {
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  /**
   * 获取当前用户 ID
   */
  private async getCurrentUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('请先登录');
    }
    return user.id;
  }

  /**
   * GET /api/v1/user/profile - 获取用户资料
   */
  async getProfile(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const result = await this.userService.getProfile(userId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * PATCH /api/v1/user/profile - 更新用户资料
   */
  async updateProfile(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const body = await req.json();
      const validated = UpdateProfileSchema.parse(body);

      const result = await this.userService.updateProfile(userId, validated);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/user/stats - 获取用户统计
   */
  async getStats(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const result = await this.userService.getStats(userId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/user/avatar - 上传头像
   */
  async uploadAvatar(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return successResponse({ error: '请选择要上传的头像' }, 400);
      }

      const result = await this.userService.uploadAvatar(userId, file);

      return successResponse(result, 201);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * DELETE /api/v1/user/avatar - 删除头像
   */
  async deleteAvatar(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const result = await this.userService.deleteAvatar(userId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/v1/user/change-password - 修改密码
   */
  async changePassword(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const body = await req.json();
      const validated = ChangePasswordSchema.parse(body);

      const result = await this.userService.changePassword(
        userId,
        validated.currentPassword,
        validated.newPassword
      );

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * DELETE /api/v1/user/account - 删除账户
   */
  async deleteAccount(req: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getCurrentUserId();

      const result = await this.userService.deleteAccount(userId);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }
}
