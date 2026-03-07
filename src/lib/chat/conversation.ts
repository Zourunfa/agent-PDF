/**
 * Conversation utilities
 */

import { ChatMessage, MessageRole } from "@/types/chat";

/**
 * Generate a UUID (browser-compatible)
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a new conversation ID
 */
export function createConversationId(): string {
  return generateUUID();
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
    id: generateUUID(),
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
    id: generateUUID(),
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
