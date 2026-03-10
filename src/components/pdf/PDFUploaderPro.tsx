/**
 * PDF Uploader - Ant Design Modern
 */

"use client";

import React, { useState } from "react";
import { Upload, message, Progress } from "antd";
import { InboxOutlined, FileTextOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { usePDF } from "@/contexts/PDFContext";
import { validatePDFFile } from "@/lib/utils/validation";

const { Dragger } = Upload;

export function PDFUploaderPro() {
  const { addPDF, setActivePdf } = usePDF();
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
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          const { pdfId, fileName, fileSize, uploadedAt, parseStatus, tempPath, base64Data } = result.data;
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
            tempPath,
            base64Data,
          });

          setActivePdf(pdfId);

          await fetch("/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfId }),
          });

          let pollAttempts = 0;
          const maxPollAttempts = 30;
          let textContent: string | null = null;
          let pageCount: number | null = null;

          while (pollAttempts < maxPollAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            pollAttempts++;

            const pollResponse = await fetch(`/api/parse?pdfId=${pdfId}`);
            const pollResult = await pollResponse.json();

            if (pollResult.success && pollResult.data) {
              if (pollResult.data.parseStatus === 'completed') {
                textContent = pollResult.data.textContent || null;
                pageCount = pollResult.data.pageCount || null;
                break;
              } else if (pollResult.data.parseStatus === 'failed') {
                break;
              }
            }
          }

          if (textContent) {
            addPDF({
              id: pdfId,
              fileName,
              sanitizedName: validation.sanitizedName || fileName,
              fileSize,
              mimeType: (file as File).type,
              uploadedAt: new Date(uploadedAt),
              parseStatus: 'completed' as any,
              textContent,
              pageCount,
              tempPath,
              base64Data,
            });
          }

          setProgress(100);
          message.success("上传成功！");
          onSuccess?.(result);
        } else {
          throw new Error(result.error?.message || "上传失败");
        }
      } catch (error: any) {
        console.error("Upload error:", error);
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
    <div style={{ position: 'relative' }}>
      <Dragger
        {...uploadProps}
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 12,
          border: '2px dashed #D1D5DB',
          paddingBottom: 16
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#6366F1', fontSize: 48 }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 500, color: '#1E1B4B' }}>
          点击或拖拽文件到此区域上传
        </p>
        <p className="ant-upload-hint" style={{ fontSize: 12, color: '#9CA3AF' }}>
          支持 PDF 格式，最大 1MB，支持 OCR 扫描件识别
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
