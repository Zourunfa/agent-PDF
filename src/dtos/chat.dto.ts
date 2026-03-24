import { z } from 'zod';

/**
 * 发送消息请求 Schema
 */
export const SendMessageSchema = z.object({
  pdfId: z
    .string()
    .min(1, 'PDF ID is required')
    .uuid('Invalid PDF ID format'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(10000, 'Message cannot exceed 10,000 characters'),
  conversationId: z
    .string()
    .uuid('Invalid conversation ID format')
    .optional(),
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;

/**
 * 发送消息响应
 */
export interface SendMessageResult {
  conversationId: string;
  userMessage: {
    id: string;
    role: 'user';
    content: string;
    createdAt: Date;
  };
  assistantMessage: {
    id: string;
    role: 'assistant';
    content: string;
    createdAt: Date;
  };
}

/**
 * 获取对话历史请求 Schema
 */
export const GetConversationHistorySchema = z.object({
  pdfId: z
    .string()
    .min(1, 'PDF ID is required')
    .uuid('Invalid PDF ID format'),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
});

export type GetConversationHistoryDTO = z.infer<typeof GetConversationHistorySchema>;

/**
 * 对话消息
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

/**
 * 对话历史响应
 */
export interface ConversationHistoryResult {
  conversationId: string;
  pdfId: string;
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

/**
 * 流式响应事件类型
 */
export type StreamEventType = 'start' | 'token' | 'end' | 'error';

/**
 * 流式响应事件
 */
export interface StreamEvent {
  type: StreamEventType;
  data?: {
    token?: string;
    message?: string;
    conversationId?: string;
    messageId?: string;
  };
}
