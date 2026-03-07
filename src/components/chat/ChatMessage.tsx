/**
 * Chat Message Component - 精致气泡设计
 */

"use client";

import React from "react";
import { User, Bot, Copy, Check } from "lucide-react";
import { MessageRole } from "@/types/chat";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { cn } from "@/lib/utils/cn";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  className?: string;
}

export function ChatMessage({ role, content, className = "" }: ChatMessageProps) {
  const isUser = role === MessageRole.USER;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex gap-4 animate-fade-in-up",
        isUser ? "flex-row-reverse" : "",
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300",
          isUser
            ? "bg-gradient-to-br from-cyan-500 to-purple-500 shadow-lg"
            : "bg-gradient-to-br from-slate-800 to-slate-700 border border-cyan-500/20"
        )}
      >
        {/* 发光效果 */}
        {isUser && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
        )}
        <div className="relative">
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Bot className="h-5 w-5 text-cyan-400" />
          )}
        </div>
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Role Label */}
        <span className={cn(
          "text-xs font-medium mb-2 px-1",
          isUser ? "text-cyan-400" : "text-cyan-400/70"
        )}>
          {isUser ? "你" : "AI 助手"}
        </span>

        <div className="relative group/message">
          {/* 消息气泡 */}
          <div
            className={cn(
              "relative rounded-2xl px-5 py-3.5 transition-all duration-300",
              isUser
                ? "bg-gradient-to-br from-cyan-500/90 to-purple-500/90 text-white backdrop-blur-sm border border-cyan-400/30"
                : "bg-slate-800/80 text-cyan-100 backdrop-blur-sm border border-cyan-500/20"
            )}
          >
            {/* 用户消息发光效果 */}
            {isUser && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover/message:opacity-50 transition-opacity -z-10" />
            )}
            
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            ) : (
              <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-invert">
                <MarkdownRenderer content={content} />
              </div>
            )}
          </div>

          {/* 复制按钮 - 仅 AI 消息显示 */}
          {!isUser && content && (
            <button
              onClick={handleCopy}
              className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/message:opacity-100 transition-all duration-200 p-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg hover:scale-110"
              title={copied ? "已复制" : "复制内容"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-cyan-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
