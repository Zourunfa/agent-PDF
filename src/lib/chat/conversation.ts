/**
 * Conversation utilities
 */

import { randomUUID } from "crypto";
import { ChatMessage, MessageRole } from "@/types/chat";

/**
 * Create a new conversation ID
 */
export function createConversationId(): string {
  return randomUUID();
}

/**
 * Create a user message
 */
export function createUserMessage(
  conversationId: string,
  pdfId: string,
  content: string
): ChatMessage {
  return {
    id: randomUUID(),
    conversationId,
    pdfId,
    role: MessageRole.USER,
    content,
    timestamp: new Date(),
    isStreaming: false,
    metadata: null,
  };
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(
  conversationId: string,
  pdfId: string,
  content: string,
  metadata?: ChatMessage["metadata"]
): ChatMessage {
  return {
    id: randomUUID(),
    conversationId,
    pdfId,
    role: MessageRole.ASSISTANT,
    content,
    timestamp: new Date(),
    isStreaming: false,
    metadata: metadata || null,
  };
}

/**
 * Format messages for LangChain
 */
export function formatMessagesForLangChain(
  messages: ChatMessage[]
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m.role !== MessageRole.SYSTEM)
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
}

/**
 * Check if conversation has messages
 */
export function hasMessages(messages: ChatMessage[]): boolean {
  return messages.length > 0;
}

/**
 * Get last N messages
 */
export function getLastMessages(messages: ChatMessage[], count: number): ChatMessage[] {
  return messages.slice(-count);
}
