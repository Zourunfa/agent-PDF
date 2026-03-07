/**
 * Chat Interface Component - 精致交互设计
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare, Sparkles, Loader2, RotateCcw, Zap } from "lucide-react";
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
      <div className={`flex h-full flex-col items-center justify-center ${className} relative overflow-hidden`}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        
        <div className="relative text-center space-y-6 animate-fade-in-up">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse-glow" />
            <div className="relative flex items-center justify-center h-24 w-24 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl border border-cyan-500/20 backdrop-blur-sm">
              <MessageSquare className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold neon-text-cyan">开始智能对话</h3>
            <p className="text-sm text-cyan-400/60 max-w-xs mx-auto">上传并选择 PDF 文档，开启 AI 驱动的文档分析之旅</p>
          </div>
        </div>
      </div>
    );
  }

  const displayMessages = [...messages, ...localMessages];

  return (
    <div className={`flex h-full flex-col ${className} relative`}>
      {/* 顶部信息栏 */}
      <div className="px-6 py-4 border-b border-cyan-500/20 glass-strong">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-500/30">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-cyan-400">AI 对话助手</h3>
              <p className="text-xs text-cyan-400/50">基于文档内容的智能问答</p>
            </div>
          </div>
          {displayMessages.length > 0 && (
            <button
              onClick={() => {
                if (conversationId) {
                  setActiveConversation(conversationId);
                  setLocalMessages([]);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200 group"
              title="清空对话"
            >
              <RotateCcw className="h-3.5 w-3.5 text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-xs text-cyan-400">清空</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-6 py-6 scrollbar-thin relative">
        {displayMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl animate-pulse-glow" />
                <div className="relative flex items-center justify-center h-20 w-20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
                  <Zap className="h-10 w-10 text-cyan-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold neon-text-cyan">开始提问</p>
                <p className="text-sm text-cyan-400/60 max-w-xs mx-auto">询问关于文档的任何问题，AI 将为您提供精准解答</p>
              </div>
              {/* 示例问题 */}
              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto mt-8">
                {[
                  "这份文档的主要内容是什么？",
                  "帮我总结一下关键要点",
                  "文档中提到了哪些重要数据？"
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(question)}
                    className="px-4 py-2.5 text-xs text-left text-cyan-400/70 hover:text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/30 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    {question}
                  </button>
                ))}
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
      <div className="border-t border-cyan-500/20 glass-strong px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* 输入框容器 */}
            <div className="relative group">
              {/* 发光边框效果 */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
              
              <div className="relative flex items-center gap-3 bg-slate-900/80 border border-cyan-500/30 rounded-2xl px-5 py-3.5 transition-all duration-200 backdrop-blur-sm group-focus-within:border-cyan-500/50 group-focus-within:bg-slate-900/90">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入您的问题..."
                  disabled={isStreaming}
                  className="flex-1 bg-transparent text-sm text-cyan-100 placeholder:text-cyan-400/40 focus:outline-none disabled:opacity-50"
                />

                {isStreaming && (
                  <div className="flex items-center gap-2 pr-2 animate-fade-in">
                    <div className="relative">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-sm animate-pulse" />
                    </div>
                    <span className="text-xs text-cyan-400/70">AI 思考中...</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isStreaming}
                  className={`relative flex-shrink-0 rounded-xl p-2.5 transition-all duration-200 group/btn ${
                    input.trim() && !isStreaming
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:scale-110 hover:rotate-12 neon-glow-cyan"
                      : "bg-slate-800/50 text-cyan-400/30 cursor-not-allowed border border-cyan-500/10"
                  }`}
                  title={input.trim() && !isStreaming ? "发送消息 (Enter)" : "输入消息后发送"}
                >
                  <Send className={`h-4 w-4 transition-transform duration-200 ${
                    input.trim() && !isStreaming ? "group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" : ""
                  }`} />
                  {input.trim() && !isStreaming && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-md opacity-50 group-hover/btn:opacity-75 transition-opacity" />
                  )}
                </button>
              </div>
            </div>

            {/* 提示文本 */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <p className="text-xs text-cyan-400/50">
                <kbd className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400/70">Enter</kbd> 发送
              </p>
              <span className="text-cyan-400/30">·</span>
              <p className="text-xs text-cyan-400/50">
                <kbd className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400/70">Shift + Enter</kbd> 换行
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
