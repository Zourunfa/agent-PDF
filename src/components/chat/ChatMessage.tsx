/**
 * Chat Message Component - 极简艺术风格
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
        "group flex gap-3.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "",
        className
      )}
    >
      {/* Avatar - 极简圆形设计 */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200",
          isUser
            ? "bg-foreground text-background shadow-sm"
            : "bg-secondary/80 text-foreground/60"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Message Bubble - 柔和的极简设计 */}
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 transition-all duration-200",
            isUser
              ? "bg-foreground text-background shadow-sm"
              : "bg-secondary/60 text-foreground/80 backdrop-blur-sm"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          ) : (
            <div className="text-sm leading-relaxed text-foreground/80">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>

        {/* Metadata indicator (subtle) */}
        {isUser && (
          <span className="mt-1 text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
            你
          </span>
        )}
      </div>
    </div>
  );
}
