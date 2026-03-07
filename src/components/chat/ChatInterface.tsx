/**
 * Chat Interface Component - 现代设计
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { usePDF } from "@/contexts/PDFContext";
import { createUserMessage, createAssistantMessage } from "@/lib/chat/conversation";
import { MessageRole } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className = "" }: ChatInterfaceProps) {
  const { activePdfId } = usePDF();
  const {
    conversations,
    activeConversationId,
    isStreaming,
    addMessage,
    setActiveConversation,
    setStreaming,
  } = useChat();

  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    role: MessageRole;
    content: string;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = activeConversationId
    ? conversations.get(activeConversationId) || []
    : [];

  const conversationId = activePdfId ? `conv-${activePdfId}` : null;

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, localMessages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !activePdfId || isStreaming) return;

    const userMessage = createUserMessage(conversationId!, activePdfId, input);
    addMessage(conversationId!, userMessage);

    setLocalMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}-user`, role: MessageRole.USER, content: input },
      { id: `local-${Date.now()}-assistant`, role: MessageRole.ASSISTANT, content: "" },
    ]);

    setInput("");
    setStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfId: activePdfId,
          question: input,
          conversationId: conversationId!,
          history: messages,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "token") {
                  assistantMessage += data.content || "";
                  setLocalMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === MessageRole.ASSISTANT) {
                      last.content = assistantMessage;
                    }
                    return updated;
                  });
                } else if (data.type === "end") {
                  const aiMessage = createAssistantMessage(
                    conversationId!,
                    activePdfId,
                    assistantMessage,
                    data.metadata
                  );
                  addMessage(conversationId!, aiMessage);
                  setLocalMessages((prev) => [...prev.slice(0, -1), {
                    id: `local-${Date.now()}-assistant-final`,
                    role: MessageRole.ASSISTANT,
                    content: assistantMessage,
                  }]);
                } else if (data.type === "error") {
                  assistantMessage = `错误: ${data.error?.message || "未知错误"}`;
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setLocalMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `local-${Date.now()}-error`,
          role: MessageRole.ASSISTANT,
          content: "抱歉，发生错误，请重试。",
        },
      ]);
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [
    input,
    activePdfId,
    isStreaming,
    conversationId,
    messages,
    addMessage,
    setStreaming,
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (!activePdfId) {
    return (
      <div className={`flex h-full flex-col items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center h-20 w-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mx-auto">
            <MessageSquare className="h-10 w-10 text-blue-600" />
          </div>
          <div>
            <p className="text-base font-medium text-gray-900 mb-1">开始对话</p>
            <p className="text-sm text-gray-500">上传并选择 PDF 后开始智能对话</p>
          </div>
        </div>
      </div>
    );
  }

  const displayMessages = [...messages, ...localMessages];

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {displayMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mx-auto">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 mb-1">开始提问</p>
                <p className="text-sm text-gray-500">询问关于文档的任何问题</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {displayMessages.map((msg, idx) => (
              <ChatMessage
                key={msg.id || `local-${idx}`}
                role={msg.role}
                content={msg.content}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-xl px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-2xl px-5 py-3.5 transition-all duration-200 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/10">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题..."
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />

              {isStreaming && (
                <div className="flex items-center gap-2 pr-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-xs text-gray-500">思考中...</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isStreaming}
                className={`flex-shrink-0 rounded-xl p-2.5 transition-all duration-200 ${
                  input.trim() && !isStreaming
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                title={input.trim() && !isStreaming ? "发送消息" : "输入消息后发送"}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              按 Enter 发送 · Shift + Enter 换行
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
