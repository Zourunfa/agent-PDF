/**
 * User Avatar Upload API
 *
 * 上传用户头像
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { createClient } from '@/lib/supabase/server';

// 强制动态渲染，因为使用了 cookies()
export const dynamic = 'force-dynamic';

// POST /api/user/avatar - 上传头像
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录',
          },
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    // 验证文件
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '请选择要上传的头像文件',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: '只支持 JPG、PNG、GIF 和 WebP 格式的图片',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: '头像文件大小不能超过 5MB',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 生成文件名
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Avatar API] Upload error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: '上传头像失败',
          },
        },
        { status: 500 }
      );
    }

    // 获取公共 URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // 更新用户资料中的头像 URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Avatar API] Update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: '更新头像失败',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatarUrl,
      },
    });
  } catch (error) {
    console.error('[Avatar API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '上传头像失败',
        },
      },
      { status: 500 }
    );
  }
}
