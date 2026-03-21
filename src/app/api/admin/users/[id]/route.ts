/**
 * Admin Delete User API Route
 * 管理员删除用户接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromHeaders } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * 清理用户所有相关数据的辅助函数
 */
async function cleanupUserData(userId: string, supabase: any) {
  console.log('[Admin Delete User] 开始清理用户数据:', userId);

  // 首先检查 user_profiles 是否存在
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  console.log('[Admin Delete User] 检查 user_profiles:', existingProfile);

  // 清理配额操作日志
  console.log('[Admin Delete User] 清理配额操作日志...');
  const { error: quotaOpsError } = await supabase
    .from('quota_operations')
    .delete()
    .eq('user_id', userId);
  if (quotaOpsError) console.warn('[Admin Delete User] 配额操作日志删除失败:', quotaOpsError.message);
  else console.log('[Admin Delete User] ✓ 配额操作日志已删除');

  // 清理配额使用记录
  console.log('[Admin Delete User] 清理配额使用记录...');
  const { error: quotaUsageError } = await supabase
    .from('quota_usage')
    .delete()
    .eq('user_id', userId);
  if (quotaUsageError) console.warn('[Admin Delete User] 配额使用记录删除失败:', quotaUsageError.message);
  else console.log('[Admin Delete User] ✓ 配额使用记录已删除');

  // 清理用户配额
  console.log('[Admin Delete User] 清理用户配额...');
  const { error: userQuotasError } = await supabase
    .from('user_quotas')
    .delete()
    .eq('user_id', userId);
  if (userQuotasError) console.warn('[Admin Delete User] 用户配额删除失败:', userQuotasError.message);
  else console.log('[Admin Delete User] ✓ 用户配额已删除');

  // 清理用户会话
  console.log('[Admin Delete User] 清理用户会话...');
  const { error: sessionsError } = await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId);
  if (sessionsError) console.warn('[Admin Delete User] 用户会话删除失败:', sessionsError.message);
  else console.log('[Admin Delete User] ✓ 用户会话已删除');

  // 清理安全日志
  console.log('[Admin Delete User] 清理安全日志...');
  const { error: securityLogError } = await supabase
    .from('user_security_log')
    .delete()
    .eq('user_id', userId);
  if (securityLogError) console.warn('[Admin Delete User] 安全日志删除失败:', securityLogError.message);
  else console.log('[Admin Delete User] ✓ 安全日志已删除');

  // 清理对话消息
  console.log('[Admin Delete User] 清理对话消息...');
  const { error: messagesError } = await supabase
    .from('conversation_messages')
    .delete()
    .eq('user_id', userId);
  if (messagesError) console.warn('[Admin Delete User] 对话消息删除失败:', messagesError.message);
  else console.log('[Admin Delete User] ✓ 对话消息已删除');

  // 清理PDF对话
  console.log('[Admin Delete User] 清理PDF对话...');
  const { error: convError } = await supabase
    .from('pdf_conversations')
    .delete()
    .eq('user_id', userId);
  if (convError) console.warn('[Admin Delete User] PDF对话删除失败:', convError.message);
  else console.log('[Admin Delete User] ✓ PDF对话已删除');

  // 清理PDF记录
  console.log('[Admin Delete User] 清理PDF记录...');
  const { error: pdfsError } = await supabase
    .from('user_pdfs')
    .delete()
    .eq('user_id', userId);
  if (pdfsError) console.warn('[Admin Delete User] PDF记录删除失败:', pdfsError.message);
  else console.log('[Admin Delete User] ✓ PDF记录已删除');

  // 清理用户资料（最后清理，因为其他表可能有外键约束）
  console.log('[Admin Delete User] 清理用户资料...');

  // 使用 SQL 直接删除，绕过 RLS
  try {
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('admin_delete_user_profile', {
        target_user_id: userId
      });

    if (deleteError) {
      console.error('[Admin Delete User] ❌ RPC 删除失败:', deleteError);

      // 如果 RPC 失败，尝试逐个删除
      console.log('[Admin Delete User] 尝试逐个删除表数据...');

      // 删除 quota_operations
      const { error: e1 } = await supabase.from('quota_operations').delete().eq('user_id', userId);
      console.log('[Admin Delete User] quota_operations:', e1 ? '失败' : '成功');

      // 删除 quota_usage
      const { error: e2 } = await supabase.from('quota_usage').delete().eq('user_id', userId);
      console.log('[Admin Delete User] quota_usage:', e2 ? '失败' : '成功');

      // 删除 user_quotas
      const { error: e3 } = await supabase.from('user_quotas').delete().eq('user_id', userId);
      console.log('[Admin Delete User] user_quotas:', e3 ? '失败' : '成功');

      // 删除 user_sessions
      const { error: e4 } = await supabase.from('user_sessions').delete().eq('user_id', userId);
      console.log('[Admin Delete User] user_sessions:', e4 ? '失败' : '成功');

      // 删除 user_security_log
      const { error: e5 } = await supabase.from('user_security_log').delete().eq('user_id', userId);
      console.log('[Admin Delete User] user_security_log:', e5 ? '失败' : '成功');

      // 删除 conversation_messages
      const { error: e6 } = await supabase.from('conversation_messages').delete().eq('user_id', userId);
      console.log('[Admin Delete User] conversation_messages:', e6 ? '失败' : '成功');

      // 删除 pdf_conversations
      const { error: e7 } = await supabase.from('pdf_conversations').delete().eq('user_id', userId);
      console.log('[Admin Delete User] pdf_conversations:', e7 ? '失败' : '成功');

      // 删除 user_pdfs
      const { error: e8 } = await supabase.from('user_pdfs').delete().eq('user_id', userId);
      console.log('[Admin Delete User] user_pdfs:', e8 ? '失败' : '成功');

      // 删除 user_profiles
      const { error: e9, count } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)
        .select('*', { count: 'exact', head: false });
      console.log('[Admin Delete User] user_profiles:', e9 ? '失败' : '成功', '删除数量:', count);

      if (e9) {
        console.error('[Admin Delete User] ❌ 用户资料删除失败:', e9);
      }
    } else {
      console.log('[Admin Delete User] ✓ RPC 删除成功:', deleteResult);
    }
  } catch (error) {
    console.error('[Admin Delete User] ❌ 删除过程出错:', error);
  }

  // 再次确认是否删除成功
  const { data: remainingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (remainingProfile) {
    console.error('[Admin Delete User] ❌❌❌ 用户资料仍然存在！ID:', remainingProfile.id);
  } else {
    console.log('[Admin Delete User] ✓✓✓ 确认用户资料已不存在');
  }

  console.log('[Admin Delete User] ✓ 用户数据清理完成');
}

async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const { isAdmin, error } = await getAdminFromHeaders(req.headers);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '需要管理员权限',
          },
        },
        { status: 403 }
      );
    }

    const userId = params.id;
    console.log('[Admin Delete User] 删除用户 ID:', userId);
    console.log('[Admin Delete User] ID 类型:', typeof userId);
    console.log('[Admin Delete User] ID 长度:', userId?.length);

    const supabase = createAdminClient();

    // 检查用户是否存在，并获取邮箱（用于后续删除 auth.users）
    const { data: user, error: queryError } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle(); // 使用 maybeSingle 而不是 single，避免 0 行时报错

    console.log('[Admin Delete User] 查询结果:', { user, queryError });

    // 如果 user_profiles 中不存在这个用户
    if (!user) {
      console.warn('[Admin Delete User] user_profiles 中未找到用户 ID:', userId);

      // 使用 RPC 清理所有可能残留的数据（绕过 RLS）
      console.log('[Admin Delete User] 使用 RPC 清理残留数据...');
      try {
        const { data: deleteResult, error: deleteError } = await supabase
          .rpc('admin_delete_user_profile', {
            target_user_id: userId
          });

        if (deleteError) {
          console.warn('[Admin Delete User] RPC 清理失败（可能已无数据）:', deleteError.message);
        } else {
          console.log('[Admin Delete User] ✓ RPC 清理成功:', deleteResult);
        }
      } catch (e) {
        console.warn('[Admin Delete User] RPC 清理异常:', e);
      }

      // 然后尝试删除 auth.users
      console.log('[Admin Delete User] 删除 auth.users...');
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error('[Admin Delete User] ❌ Auth删除失败:', authDeleteError);
          console.error('[Admin Delete User] 错误详情:', JSON.stringify(authDeleteError, null, 2));

          // 如果删除失败，返回错误
          return NextResponse.json({
            success: false,
            error: {
              code: 'DELETE_AUTH_FAILED',
              message: '删除 auth.users 失败，可能存在依赖数据',
              details: authDeleteError.message,
            },
          }, { status: 500 });
        } else {
          console.log('[Admin Delete User] ✓ auth.users 已删除');

          return NextResponse.json({
            success: true,
            message: '用户已删除',
          });
        }
      } catch (authError: any) {
        console.error('[Admin Delete User] ❌ 删除 auth.users 异常:', authError);

        return NextResponse.json({
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: '删除用户失败',
            details: authError.message,
          },
        }, { status: 500 });
      }
    }

    console.log('[Admin Delete User] 开始删除用户数据:', userId, '邮箱:', user.email);

    // 步骤1: 使用 RPC 删除所有 public schema 的数据（包括 user_profiles）
    console.log('[Admin Delete User] 步骤1: 清理所有关联数据...');
    let rpcSuccess = false;

    try {
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc('admin_delete_user_profile', {
          target_user_id: userId  // 注意参数名是 target_user_id
        });

      if (deleteError) {
        console.error('[Admin Delete User] ❌ RPC 删除失败:', deleteError);
        console.error('[Admin Delete User] 错误详情:', JSON.stringify(deleteError, null, 2));
      } else {
        console.log('[Admin Delete User] ✓ RPC 删除成功:', deleteResult);
        rpcSuccess = true;
      }
    } catch (error: any) {
      console.error('[Admin Delete User] ❌ RPC 删除异常:', error);
    }

    // 步骤2: 删除 auth.users
    console.log('[Admin Delete User] 步骤2: 删除 auth.users');

    let authDeleteSuccess = false;
    let authDeleteError = null;

    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('[Admin Delete User] ❌ Auth删除失败:', deleteError);
        console.error('[Admin Delete User] 错误详情:', JSON.stringify(deleteError, null, 2));
        authDeleteError = deleteError;
      } else {
        console.log('[Admin Delete User] ✓ auth.users 已删除');
        authDeleteSuccess = true;
      }
    } catch (error: any) {
      console.error('[Admin Delete User] ❌ 删除 auth.users 异常:', error);
      authDeleteError = error;
    }

    // 如果 auth.users 删除失败，整个操作失败
    if (!authDeleteSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_AUTH_FAILED',
            message: '删除 auth.users 失败',
            details: authDeleteError?.message,
          },
        },
        { status: 500 }
      );
    }
    if (!authDeleteSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_AUTH_FAILED',
            message: '删除 auth.users 失败，用户仍可登录',
            details: authDeleteError?.message,
          },
        },
        { status: 500 }
      );
    }

    console.log('[Admin Delete User] ✓✓✓ 用户已完全删除:', user.name || user.id);

    return NextResponse.json({
      success: true,
      message: '用户已完全删除',
    });
  } catch (error) {
    console.error('[Admin Delete User] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除用户失败',
        },
      },
      { status: 500 }
    );
  }
}

async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const { isAdmin, error: authError } = await getAdminFromHeaders(req.headers);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '需要管理员权限',
          },
        },
        { status: 403 }
      );
    }

    const userId = params.id;
    const { role } = await req.json();

    console.log('[Admin Update User] 更新用户:', userId, '角色:', role);

    const supabase = createAdminClient();

    // 更新用户角色
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, name, role')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '用户不存在',
          },
        },
        { status: 404 }
      );
    }

    console.log('[Admin Update User] ✓ 用户已更新:', data.name || data.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Admin Update User] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新用户失败',
        },
      },
      { status: 500 }
    );
  }
}

export { DELETE, PATCH };
