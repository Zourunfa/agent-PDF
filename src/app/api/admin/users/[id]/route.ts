/**
 * Admin Delete User API Route
 * 管理员删除用户接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromHeaders } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
    console.log('[Admin Delete User] 删除用户:', userId);

    const supabase = createAdminClient();

    // 检查用户是否存在
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (!user) {
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

    console.log('[Admin Delete User] 开始删除用户数据:', userId);

    // 步骤1: 删除用户的 PDF 文件记录（从数据库）
    const { data: userPdfs } = await supabase.from('user_pdfs').select('id').eq('user_id', userId);

    if (userPdfs && userPdfs.length > 0) {
      console.log('[Admin Delete User] 删除', userPdfs.length, '个PDF记录');
      await supabase.from('user_pdfs').delete().eq('user_id', userId);
    }

    // 步骤2: 删除用户的对话记录
    const { data: userConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId);

    if (userConversations && userConversations.length > 0) {
      console.log('[Admin Delete User] 删除', userConversations.length, '条对话记录');
      await supabase.from('conversations').delete().eq('user_id', userId);
    }

    // 步骤3: 删除用户资料
    const { error: profileError } = await supabase.from('user_profiles').delete().eq('id', userId);

    if (profileError) {
      console.error('[Admin Delete User] Profile删除失败:', profileError);
    }

    // 步骤4: 删除 auth.users（认证记录）- 这是最重要的
    console.log('[Admin Delete User] 删除 auth.users 记录, userId:', userId);

    // 先通过邮箱查找用户（因为 user_profiles.id 可能和 auth.users.id 不一致）
    const { data: profileWithEmail } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    console.log('[Admin Delete User] 用户邮箱:', profileWithEmail?.email);

    // 列出所有用户，通过邮箱找到对应的 auth.users.id
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('[Admin Delete User] 列出用户失败:', listError);
    } else {
      const targetUser = allUsers.users.find((u) => u.email === profileWithEmail?.email);
      if (targetUser) {
        console.log(
          '[Admin Delete User] 找到 auth 用户, authId:',
          targetUser.id,
          'email:',
          targetUser.email
        );

        // 使用正确的 auth.users.id 删除
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(targetUser.id);

        if (authDeleteError) {
          console.error('[Admin Delete User] Auth删除失败:', authDeleteError);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'AUTH_DELETE_FAILED',
                message: `删除认证记录失败: ${authDeleteError.message}`,
              },
            },
            { status: 500 }
          );
        }

        console.log('[Admin Delete User] ✓ auth.users 删除成功');
      } else {
        console.warn(
          '[Admin Delete User] auth.users 中未找到邮箱为',
          profileWithEmail?.email,
          '的用户'
        );
        // 即使 auth.users 中不存在，也继续（可能是游客用户）
      }
    }

    console.log('[Admin Delete User] ✓ 用户已删除:', user.name || user.id);

    return NextResponse.json({
      success: true,
      message: '用户已删除',
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
