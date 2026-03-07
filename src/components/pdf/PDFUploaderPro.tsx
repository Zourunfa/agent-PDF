/**
 * PDF Uploader - Ant Design
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Upload, message, Progress } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { usePDF } from "@/contexts/PDFContext";
import { useChat } from "@/contexts/ChatContext";
import { validatePDFFile } from "@/lib/utils/validation";
import { ParseStatus } from "@/types/pdf";
import { createUserMessage, createAssistantMessage } from "@/lib/chat/conversation";

const { Dragger } = Upload;

export function PDFUploaderPro() {
  const { addPDF, setActivePdf, pdfs, updatePdfContent } = usePDF();
  const { addMessage, setActiveConversation, setStreaming } = useChat();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUploadedPdfId, setLastUploadedPdfId] = useState<string | null>(null);

  // 自动总结函数
  const autoSummarize = useCallback(async (pdfId: string) => {
    const conversationId = `conv-${pdfId}`;
    const question = "请详细总结这个文件的主要内容、关键信息和重点";
    
    // 设置活动对话
    setActiveConversation(conversationId);
    
    // 添加用户消息
    const userMessage = createUserMessage(conversationId, pdfId, question);
    addMessage(conversationId, userMessage);
    
    setStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pdfId, 
          question, 
          conversationId, 
          history: [] 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "token" && data.content) {
                  assistantContent += data.content;
                } else if (data.type === "end") {
                  // 完成流式传输，添加最终消息
                  const aiMessage = createAssistantMessage(
                    conversationId, 
                    pdfId, 
                    assistantContent, 
                    data.metadata
                  );
                  addMessage(conversationId, aiMessage);
                  message.success("文档总结完成！");
                }
              } catch (e) {
                console.error("Parse SSE error:", e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Auto-summarize error:", error);

      // 检查是否是AI配置错误
      const errorCode = error?.code || error?.error?.code;
      if (errorCode === "AI_NOT_CONFIGURED") {
        message.warning({
          content: "AI服务未配置，请设置环境变量 ALIBABA_API_KEY 或 QWEN_API_KEY",
          duration: 5,
        });
      } else {
        message.error("自动总结失败，请手动提问");
      }
    } finally {
      setStreaming(false);
    }
  }, [addMessage, setActiveConversation, setStreaming]);

  // 使用ref来存储最新的回调函数，避免依赖问题
  const autoSummarizeRef = useRef(autoSummarize);

  // 更新ref
  useEffect(() => {
    autoSummarizeRef.current = autoSummarize;
  }, [autoSummarize]);

  useEffect(() => {
    if (!lastUploadedPdfId) return;

    // 轮询PDF解析状态
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/parse?pdfId=${lastUploadedPdfId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.parseStatus === ParseStatus.COMPLETED) {
            // 解析完成，清除轮询
            clearInterval(pollInterval);

            // 更新本地PDF状态
            const pdf = pdfs.get(lastUploadedPdfId);
            if (pdf) {
              updatePdfContent(
                lastUploadedPdfId,
                result.data.textContent || "",
                result.data.pageCount || 0
              );
            }

            // 自动选中和总结
            setActivePdf(lastUploadedPdfId);
            setTimeout(() => {
              autoSummarizeRef.current(lastUploadedPdfId);
            }, 500);
            setLastUploadedPdfId(null);
          } else if (result.data && result.data.parseStatus === ParseStatus.FAILED) {
            // 解析失败
            clearInterval(pollInterval);
            message.error("PDF解析失败");
            setLastUploadedPdfId(null);
          }
        }
      } catch (error) {
        console.error("Poll error:", error);
      }
    }, 2000); // 每2秒轮询一次

    // 清理函数：如果组件卸载或lastUploadedPdfId改变，清除轮询
    return () => clearInterval(pollInterval);
  }, [lastUploadedPdfId, pdfs, setActivePdf, updatePdfContent]);

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
          setLastUploadedPdfId(pdfId);
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
