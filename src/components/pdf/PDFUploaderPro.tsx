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

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    showUploadList: false,
    disabled: uploading,
    beforeUpload: (file) => {
      const validation = validatePDFFile(file);
      if (!validation.valid) {
        message.error(validation.error || "文件验证失败");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 10));
      }, 100);

      try {
        const formData = new FormData();
        formData.append("file", file as File);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          const { pdfId, fileName, fileSize, uploadedAt, parseStatus, tempPath } = result.data;
          const validation = validatePDFFile(file as File);

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
          });

          await fetch("/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfId }),
          });

          setProgress(100);
          message.success("上传成功！");
          onSuccess?.(result);
        } else {
          throw new Error(result.error?.message || "上传失败");
        }
      } catch (error: any) {
        message.error(error.message || "上传失败，请重试");
        onError?.(error);
      } finally {
        clearInterval(progressInterval);
        setUploading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
  };

  return (
    <div>
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
