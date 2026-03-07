/**
 * Chat Message Component - 现代设计
 */

"use client";

import React from "react";
import { User, Bot } from "lucide-react";
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

  return (
    <div
      className={cn(
        "group flex gap-4 animate-fade-in",
        isUser ? "flex-row-reverse" : "",
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
            : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Role Label */}
        <span className="text-xs font-medium text-gray-500 mb-1.5 px-1">
          {isUser ? "你" : "AI 助手"}
        </span>

        <div
          className={cn(
            "rounded-2xl px-5 py-3.5 transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-white text-gray-900 shadow-md border border-gray-100"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
