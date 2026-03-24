import { createClient } from '@/lib/supabase/server';
import type { User, UserQuota, UserStats, UserProfile } from '@/models/user.model';
import { mapDbToUser } from '@/models/user.model';
import { DatabaseError, NotFoundError } from '@/lib/utils/errors';

/**
 * 用户数据访问层
 * 封装所有用户相关的数据库操作
 */
export class UserRepository {
  /**
   * 根据 ID 获取用户
   */
  async findById(userId: string): Promise<User | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new DatabaseError(`Failed to fetch user: ${error.message}`);
      }

      return mapDbToUser(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch user');
    }
  }

  /**
   * 根据 Email 获取用户
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Failed to fetch user by email: ${error.message}`);
      }

      return mapDbToUser(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch user by email');
    }
  }

  /**
   * 创建用户资料
   */
  async create(userId: string, email: string, name?: string): Promise<User> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          name: name || email.split('@')[0],
          role: 'user',
          email_verified: false,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create user: ${error.message}`);
      }

      return mapDbToUser(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create user');
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, updates: { name?: string; avatarUrl?: string | null }): Promise<User> {
    try {
      const supabase = await createClient();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.avatarUrl !== undefined) {
        updateData.avatar_url = updates.avatarUrl;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update user profile: ${error.message}`);
      }

      if (!data) {
        throw new NotFoundError('User not found');
      }

      return mapDbToUser(data);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update user profile');
    }
  }

  /**
   * 更新邮箱验证状态
   */
  async updateEmailVerified(userId: string, verified: boolean): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('user_profiles')
        .update({
          email_verified: verified,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw new DatabaseError(`Failed to update email verified status: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update email verified status');
    }
  }

  /**
   * 获取用户配额
   */
  async getQuota(userId: string): Promise<UserQuota | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Failed to fetch user quota: ${error.message}`);
      }

      return {
        pdfUploadsDaily: data.pdf_uploads_daily || 0,
        pdfUploadsDailyLimit: data.pdf_uploads_daily_limit || 3,
        aiCallsDaily: data.ai_calls_daily || 0,
        aiCallsDailyLimit: data.ai_calls_daily_limit || 10,
        storageUsed: data.storage_used || 0,
        storageLimit: data.storage_limit || 100 * 1024 * 1024,
        resetAt: data.reset_at ? new Date(data.reset_at) : null,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch user quota');
    }
  }

  /**
   * 获取用户统计
   */
  async getStats(userId: string): Promise<UserStats> {
    try {
      const supabase = await createClient();

      // 并行查询统计数据
      const [pdfsResult, messagesResult] = await Promise.all([
        supabase
          .from('user_pdfs')
          .select('id, file_size', { count: 'exact', head: false })
          .eq('user_id', userId),
        supabase
          .from('conversation_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      // 计算存储使用量
      const storageUsed = pdfsResult.data?.reduce((sum, pdf) => sum + (pdf.file_size || 0), 0) || 0;

      return {
        totalPdfs: pdfsResult.count || 0,
        totalConversations: 0, // 需要单独查询 conversations 表
        totalMessages: messagesResult.count || 0,
        storageUsed,
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch user stats');
    }
  }

  /**
   * 获取用户完整资料（包含配额和统计）
   */
  async getFullProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const [quota, stats] = await Promise.all([
      this.getQuota(userId),
      this.getStats(userId),
    ]);

    return {
      ...user,
      quota: quota || {
        pdfUploadsDaily: 0,
        pdfUploadsDailyLimit: 3,
        aiCallsDaily: 0,
        aiCallsDailyLimit: 10,
        storageUsed: 0,
        storageLimit: 100 * 1024 * 1024,
        resetAt: null,
      },
      stats,
    };
  }

  /**
   * 删除用户（软删除）
   */
  async softDelete(userId: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw new DatabaseError(`Failed to soft delete user: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to soft delete user');
    }
  }
}
