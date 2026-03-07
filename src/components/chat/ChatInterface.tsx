/**
 * Chat Interface Component - 极简艺术风格
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { usePDF } from "@/contexts/PDFContext";
import { createUserMessage, createAssistantMessage } from "@/lib/chat/conversation";
import { MessageRole } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { MarkdownRenderer } from "./MarkdownRenderer";

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
    updateStreamingMessage,
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

  // Get conversation ID for active PDF
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
                // Ignore JSON parse errors for incomplete chunks
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
      // Focus input after completion
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
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center justify-center blur-xl">
            <MessageSquare className="h-20 w-20 text-foreground/5" />
          </div>
          <MessageSquare className="relative h-12 w-12 text-foreground/20 mx-auto mb-4" />
        </div>
        <p className="text-sm text-muted-foreground/70 max-w-[200px]">
          上传并选择 PDF 后开始对话
        </p>
      </div>
    );
  }

  const displayMessages = [...messages, ...localMessages];

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-6 py-5 scrollbar-thin">
        {displayMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center justify-center blur-xl">
                <Sparkles className="h-16 w-16 text-accent/10" />
              </div>
              <Sparkles className="relative h-8 w-8 text-accent/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/60">
                开始提问...
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                关于文档的任何问题
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
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

      {/* Input Area - 极简设计 */}
      <div className="border-t border-border/30 bg-background/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
              isStreaming
                ? "bg-muted/50"
                : "bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100"
            }`} />

            <div className="relative flex items-center gap-3 bg-background border border-border/40 rounded-2xl px-4 py-3 transition-all duration-200 hover:border-border/60 focus-within:border-accent/50 focus-within:shadow-sm">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题..."
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
              />

              {isStreaming && (
                <div className="flex items-center gap-1.5 pr-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-40" />
                    <span className="relative inset-0 rounded-full bg-accent" />
                  </span>
                  <span className="text-xs text-muted-foreground/50">思考中</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isStreaming}
                className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${
                  input.trim() && !isStreaming
                    ? "bg-foreground text-background hover:bg-foreground/90 hover:shadow-md"
                    : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                }`}
                title={input.trim() && !isStreaming ? "发送消息" : "输入消息后发送"}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Helper text */}
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <p className="text-[10px] text-muted-foreground/30">
                按 Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
