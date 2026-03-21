/**
 * Manual Text Input Component - Ant Design Modern
 */

"use client";

import React, { useState, useEffect } from "react";
import { Modal, Input, Button, message, Space, Typography } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { usePDF } from "@/contexts/PDFContext";

const { TextArea } = Input;
const { Text } = Typography;

interface ManualTextInputProps {
  pdfId: string;
  fileName: string;
  visible: boolean;
  onClose: () => void;
}

export function ManualTextInput({ pdfId, fileName, visible, onClose }: ManualTextInputProps) {
  const { updatePdfContent } = usePDF();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setText("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.warning("请输入文本内容");
      return;
    }

    if (text.trim().length < 50) {
      message.warning("文本内容太短，请至少输入 50 个字符");
      return;
    }

    setLoading(true);

    try {
      updatePdfContent(pdfId, text.trim(), 1);

      const response = await fetch("/api/manual-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfId,
          text: text.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success("文本已保存，可以开始对话了！");
        setText("");
        onClose();
      } else {
        throw new Error(result.error?.message || "保存失败");
      }
    } catch (error: any) {
      console.error("Manual text input error:", error);
      message.error(error.message || "保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Space size={8}>
            <FileTextOutlined style={{ color: '#6366F1' }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>手动输入文本内容</span>
          </Space>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>
            取消
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}
          >
            保存并开始对话
          </Button>
        </Space>
      }
      styles={{
        body: { padding: 24 }
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
          文件名: <strong style={{ color: '#1E1B4B' }}>{fileName}</strong>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
          由于 PDF 自动解析失败，请手动复制 PDF 中的文本内容并粘贴到下方。
          <br />
          提示：在 PDF 阅读器中选择文本，按 Ctrl+C 复制，然后粘贴到此处。
        </div>
      </div>

      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请粘贴 PDF 文本内容..."
        rows={12}
        maxLength={100000}
        showCount
        style={{ fontSize: 13, borderRadius: 8 }}
      />

      <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
        最少 50 字符，最多 100,000 字符
      </div>
    </Modal>
  );
}
