/**
 * 消息角色枚举
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 消息模型
 */
export interface Message {
  id: string;
  conversationId: string;
  pdfId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

/**
 * 对话模型
 */
export interface Conversation {
  id: string;
  pdfId: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 对话带消息列表
 */
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/**
 * 对话统计
 */
export interface ConversationStats {
  messageCount: number;
  lastMessageAt: Date | null;
}

/**
 * 创建消息的数据
 */
export interface CreateMessageData {
  conversationId: string;
  pdfId: string;
  userId: string;
  role: MessageRole;
  content: string;
}

/**
 * 消息列表查询选项
 */
export interface MessageListOptions {
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 数据库记录到 Message 模型的映射
 */
export function mapDbToMessage(data: Record<string, unknown>): Message {
  return {
    id: data.id as string,
    conversationId: data.conversation_id as string,
    pdfId: data.pdf_id as string,
    userId: data.user_id as string,
    role: data.role as MessageRole,
    content: data.content as string,
    createdAt: new Date(data.created_at as string),
  };
}

/**
 * 数据库记录到 Conversation 模型的映射
 */
export function mapDbToConversation(data: Record<string, unknown>): Conversation {
  return {
    id: data.id as string,
    pdfId: data.pdf_id as string,
    userId: data.user_id as string,
    title: data.title as string | null,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Message 模型到数据库记录的映射
 */
export function mapMessageToDb(message: Partial<Message>): Record<string, unknown> {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    pdf_id: message.pdfId,
    user_id: message.userId,
    role: message.role,
    content: message.content,
    created_at: message.createdAt?.toISOString() || new Date().toISOString(),
  };
}
