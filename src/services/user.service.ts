import { UserRepository } from '@/repositories/user.repository';
import { QuotaRepository } from '@/repositories/quota.repository';
import { PDFRepository } from '@/repositories/pdf.repository';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import type { UpdateProfileDTO, UpdateProfileResult, UserStatsResult, AvatarUploadResult } from '@/dtos/user.dto';
import type { User, UserProfile } from '@/models/user.model';

/**
 * 用户服务
 * 处理用户资料管理、统计等业务逻辑
 */
export class UserService {
  constructor(
    private userRepo: UserRepository = new UserRepository(),
    private quotaRepo: QuotaRepository = new QuotaRepository(),
    private pdfRepo: PDFRepository = new PDFRepository()
  ) {}

  /**
   * 获取用户资料
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.userRepo.getFullProfile(userId);
    if (!profile) {
      throw new NotFoundError('User profile not found');
    }
    return profile;
  }

  /**
   * 更新用户资料
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDTO
  ): Promise<UpdateProfileResult> {
    // 验证用户存在
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 更新资料
    const updatedUser = await this.userRepo.updateProfile(userId, {
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
      },
      message: 'Profile updated successfully',
    };
  }

  /**
   * 获取用户统计信息
   */
  async getStats(userId: string): Promise<UserStatsResult> {
    // 验证用户存在
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 并行获取统计数据
    const [userStats, quota] = await Promise.all([
      this.userRepo.getStats(userId),
      this.quotaRepo.getQuota(userId),
    ]);

    return {
      totalPdfs: userStats.totalPdfs,
      totalConversations: userStats.totalConversations,
      totalMessages: userStats.totalMessages,
      storageUsed: userStats.storageUsed,
      storageLimit: quota.storageLimit,
      pdfUploadsDaily: quota.pdfUploadsDaily,
      pdfUploadsDailyLimit: quota.pdfUploadsDailyLimit,
      aiCallsDaily: quota.aiCallsDaily,
      aiCallsDailyLimit: quota.aiCallsDailyLimit,
    };
  }

  /**
   * 上传头像
   */
  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<AvatarUploadResult> {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new ValidationError('File must be an image');
    }

    // 验证文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      throw new ValidationError('Image size must be less than 2MB');
    }

    // 验证用户存在
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 生成文件路径
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}.${fileExt}`;

    // 上传到存储服务（这里需要集成实际的存储服务）
    // 临时使用 Blob URL 作为示例
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 Supabase Storage 上传
    const avatarUrl = await this.uploadToStorage(fileName, buffer, file.type);

    // 更新用户资料
    await this.userRepo.updateProfile(userId, { avatarUrl });

    return {
      avatarUrl,
      message: 'Avatar uploaded successfully',
    };
  }

  /**
   * 删除头像
   */
  async deleteAvatar(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.avatarUrl) {
      // 删除存储中的文件
      await this.deleteFromStorage(user.avatarUrl);

      // 更新用户资料
      await this.userRepo.updateProfile(userId, { avatarUrl: null });
    }

    return {
      message: 'Avatar deleted successfully',
    };
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    // 验证用户存在
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 这里需要调用 AuthRepository 来修改密码
    // 实际实现中应该：
    // 1. 验证当前密码
    // 2. 更新为新密码
    const { AuthRepository } = await import('@/repositories/auth.repository');
    const authRepo = new AuthRepository();

    // Supabase Auth 的密码更新
    await authRepo.resetPassword(newPassword);

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * 删除用户账户
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    // 验证用户存在
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 软删除用户
    await this.userRepo.softDelete(userId);

    return {
      message: 'Account deleted successfully',
    };
  }

  /**
   * 上传文件到存储服务
   */
  private async uploadToStorage(
    fileName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    // 这里需要集成实际的存储服务
    // 例如 Supabase Storage, AWS S3, Vercel Blob 等

    // 使用 Supabase Storage 的示例实现
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * 从存储服务删除文件
   */
  private async deleteFromStorage(url: string): Promise<void> {
    try {
      // 从 URL 中提取文件路径
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      await supabase.storage.from('avatars').remove([`avatars/${fileName}`]);
    } catch {
      // 忽略删除错误
    }
  }
}
