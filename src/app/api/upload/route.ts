/**
 * PDF Upload API Route
 * 支持游客和登录用户上传
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validatePDFFile, validatePDFBuffer } from '@/lib/utils/validation';
import { saveTempFile, generateTempFileName } from '@/lib/storage/temp-files';
import { addPDFFile } from '@/lib/storage/pdf-files';
import { ParseStatus } from '@/types/pdf';
import { formatErrorResponse } from '@/lib/utils/errors';
import { getCurrentUser } from '@/lib/auth/middleware';
import { generateFingerprint } from '@/lib/auth/fingerprint';
import { canGuestProceed, incrementGuestUsage } from '@/lib/storage/guest-storage';
import { createClient } from '@/lib/supabase/server';
import { getDeviceInfo } from '@/lib/auth/fingerprint';
import { canUploadPDF, recordQuotaUsage } from '@/lib/quota/check';

// 强制动态渲染，因为使用了 headers()
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('📬 收到上传请求');

  try {
    // 获取用户信息
    const user = await getCurrentUser();
    const isGuest = !user;

    // 游客配额检查
    if (isGuest) {
      console.log('🎭 游客上传，检查配额...');
      const fingerprint = await generateFingerprint();
      const canProceed = await canGuestProceed(fingerprint);

      if (!canProceed) {
        console.log('❌ 游客配额已用完');
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: '您已达到免费试用上限（3次），请注册账户继续使用',
            },
            requiresAuth: true,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
    }

    // 登录用户配额检查
    if (user && user.id) {
      console.log('👤 登录用户上传，检查配额...');
      const quotaCheck = await canUploadPDF(user.id);

      if (!quotaCheck.allowed) {
        console.log('❌ 用户配额已用完:', quotaCheck);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: quotaCheck.reason || '今日上传次数已达上限',
              quota: {
                limit: quotaCheck.quotaLimit,
                used: quotaCheck.used,
                remaining: quotaCheck.remaining,
              },
            },
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }

      console.log(
        `✅ 用户配额正常: ${quotaCheck.used}/${quotaCheck.quotaLimit} (剩余: ${quotaCheck.remaining})`
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    console.log('📋 解析的文件信息:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      hasFile: !!file,
      userId: user?.id || 'guest',
    });

    if (!file) {
      console.error('❌ 未找到文件');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '未找到文件',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validatePDFFile(file);
    console.log('🔍 文件验证结果:', validation);

    if (!validation.valid) {
      console.error('❌ 文件验证失败:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 生成 ID
    const pdfId = randomUUID();
    const taskId = randomUUID();
    const sanitizedName = validation.sanitizedName || file.name;
    const tempFileName = generateTempFileName(pdfId);

    console.log('🆔 生成ID:', { pdfId, taskId, tempFileName });

    // 保存文件到临时目录
    console.log('💾 开始保存文件到临时目录...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证 PDF 文件内容（检查文件头和文件尾）
    const bufferValidation = validatePDFBuffer(buffer);
    if (!bufferValidation.valid) {
      console.error('❌ PDF 文件内容验证失败:', bufferValidation.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: bufferValidation.error || 'PDF 文件已损坏或格式不正确，请重新上传',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const tempPath = await saveTempFile(buffer, tempFileName);

    // 上传到 Vercel Blob Storage 以持久化存储
    let blobUrl: string | null = null;
    try {
      console.log('☁️ 上传 PDF 到 Vercel Blob Storage...');
      const { uploadPDFToBlob } = await import('@/lib/storage/blob-storage');
      blobUrl = await uploadPDFToBlob(pdfId, buffer, file.name);
      console.log('✅ PDF 已上传到 Blob Storage:', blobUrl);
    } catch (blobError) {
      console.warn('⚠️ Blob Storage 上传失败，将使用临时文件:', blobError);
      // 继续执行，使用临时文件作为后备
    }

    console.log('✅ 文件已保存到:', tempPath);

    // 创建 PDF 文件记录
    const pdfFile = {
      id: pdfId,
      fileName: file.name,
      sanitizedName,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      parseStatus: ParseStatus.PENDING,
      textContent: null,
      pageCount: null,
      tempPath,
    };

    console.log('📝 创建PDF记录:', {
      id: pdfFile.id,
      fileName: pdfFile.fileName,
      fileSize: pdfFile.fileSize,
      userId: user?.id || 'guest',
    });

    // 存储到内存缓存
    await addPDFFile(pdfFile);

    // 如果是登录用户，保存到数据库
    if (user && user.id) {
      console.log('💾 保存到用户数据库...');
      try {
        const { savePDFInfo, createOrGetConversation } = await import('@/lib/pdf/save-pdf-info');

        // 使用 Blob URL 或临时路径作为 storagePath
        const storagePath = blobUrl || tempPath;

        // Save PDF info
        await savePDFInfo({
          pdfId,
          userId: user.id,
          filename: file.name,
          fileSize: file.size,
          storagePath: storagePath,
          parseStatus: 'pending',
        });

        // Create conversation record
        await createOrGetConversation({
          pdfId,
          userId: user.id,
        });

        console.log('✅ 已保存到数据库并创建对话记录');
      } catch (error) {
        console.error('❌ 数据库保存失败:', error);
        // 继续执行，不阻止上传流程
      }
    }

    // 游客使用追踪
    if (isGuest) {
      console.log('🎭 记录游客使用...');
      const fingerprint = await generateFingerprint();
      await incrementGuestUsage(fingerprint, pdfId);
    }

    // 登录用户配额使用记录
    if (user && user.id) {
      console.log('📊 记录用户配额使用...');
      await recordQuotaUsage(user.id, 'pdf_uploads_daily', 1, pdfId);
    }

    console.log('✅ 上传完成，准备返回响应');

    // Convert buffer to base64 for frontend caching
    const base64Data = buffer.toString('base64');
    console.log('📦 Base64 data size:', base64Data.length, 'chars');

    return NextResponse.json({
      success: true,
      data: {
        pdfId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        parseStatus: ParseStatus.PENDING,
        uploadTaskId: taskId,
        tempPath,
        base64Data,
        userId: user?.id || null, // 返回用户ID
        isGuest,
      },
    });
  } catch (error) {
    console.error('💥 Upload error:', error);
    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
