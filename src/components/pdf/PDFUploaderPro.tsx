/**
 * PDF Uploader - Ant Design
 */

"use client";

import React, { useState } from "react";
import { Upload, message, Progress } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { usePDF } from "@/contexts/PDFContext";
import { validatePDFFile } from "@/lib/utils/validation";

const { Dragger } = Upload;

export function PDFUploaderPro() {
  const { addPDF } = usePDF();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  console.log('🔄 PDFUploaderPro 组件渲染', { uploading, progress });

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    showUploadList: false,
    disabled: uploading,
    onChange: (info) => {
      console.log('📝 onChange 事件触发:', {
        fileList: info.fileList.map(f => ({
          name: f.name,
          status: f.status,
          percent: f.percent,
          response: f.response,
        })),
      });
    },
    beforeUpload: (file) => {
      console.log('🎯 [STEP 1] beforeUpload 开始执行');
      console.log('📄 文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
      });

      const validation = validatePDFFile(file);
      console.log('✅ 验证结果:', validation);

      if (!validation.valid) {
        console.error('❌ 验证失败:', validation.error);
        message.error(validation.error || "文件验证失败");
        return Upload.LIST_IGNORE;
      }

      console.log('✅ [STEP 1 完成] 文件验证通过，即将调用 customRequest');
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      console.log('🚀 [STEP 2] customRequest 开始执行');
      console.log('📁 上传文件详情:', {
        name: (file as File).name,
        size: (file as File).size,
        type: (file as File).type,
        sizeInMB: ((file as File).size / 1024 / 1024).toFixed(2),
      });

      setUploading(true);
      setProgress(0);
      console.log('✅ 状态已更新: uploading=true, progress=0');

      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 10));
      }, 100);

      try {
        console.log('📦 [STEP 3] 准备 FormData...');
        const formData = new FormData();
        formData.append("file", file as File);
        console.log('✅ FormData 已创建，包含 file:', (file as File).name);

        console.log('🌐 [STEP 4] 发送 fetch 请求到 /api/upload');
        const startTime = Date.now();

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const endTime = Date.now();
        console.log(`⏱️ 请求耗时: ${endTime - startTime}ms`);
        console.log('📥 [STEP 5] 收到响应:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });

        const result = await response.json();

        console.log('📄 [STEP 6] JSON 解析完成，结果:', result);

        if (result.success) {
          console.log('✅ 上传成功！开始处理响应数据...');

          const { pdfId, fileName, fileSize, uploadedAt, parseStatus, tempPath, base64Data } = result.data;
          const validation = validatePDFFile(file as File);

          console.log('📋 准备添加到上下文的数据:', {
            pdfId,
            fileName,
            fileSize,
            uploadedAt,
            parseStatus,
            tempPath,
            hasBase64Data: !!base64Data,
            sanitizedName: validation.sanitizedName || fileName,
          });

          console.log('🔄 [STEP 7] 调用 addPDF 添加到上下文...');
          addPDF({
            id: pdfId,
            fileName,
            sanitizedName: validation.sanitizedName || fileName,
            fileSize,
            mimeType: (file as File).type,
            uploadedAt: new Date(uploadedAt),
            parseStatus,
            textContent: null,
            pageCount: null,
            tempPath, // 使用API返回的文件路径
            base64Data, // Cache base64 data for preview (Vercel workaround)
          });
          console.log('✅ addPDF 完成');

          console.log('📖 [STEP 8] 开始解析PDF...');
          const parseStartTime = Date.now();

          await fetch("/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfId }),
          });

          const parseEndTime = Date.now();
          console.log(`✅ 解析请求发送完成，耗时: ${parseEndTime - parseStartTime}ms`);

          console.log('🎉 [STEP 9] 所有步骤完成！');
          setProgress(100);
          message.success("上传成功！");
          onSuccess?.(result);
        } else {
          console.error('❌ 上传失败，服务器返回错误:', result.error);
          throw new Error(result.error?.message || "上传失败");
        }
      } catch (error: any) {
        console.error('💥 上传过程出错！');
        console.error('错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        message.error(error.message || "上传失败，请重试");
        onError?.(error);
      } finally {
        console.log('🧹 [FINALLY] 清理上传状态...');
        clearInterval(progressInterval);
        setUploading(false);
        console.log('✅ uploading 设置为 false');
        setTimeout(() => setProgress(0), 500);
      }
    },
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#6366F1' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持 PDF 格式，最大 10MB，支持 OCR 扫描件识别
        </p>
      </Dragger>
      {uploading && progress > 0 && (
        <div style={{ marginTop: 12 }}>
          <Progress percent={progress} status="active" strokeColor="#6366F1" />
        </div>
      )}
    </div>
  );
}
