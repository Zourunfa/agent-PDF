import { createClient } from '@/lib/supabase/server';
import type {
  Conversation,
  Message,
  ConversationWithMessages,
  ConversationStats,
  CreateMessageData,
  MessageListOptions,
} from '@/models/conversation.model';
import {
  mapDbToConversation,
  mapDbToMessage,
} from '@/models/conversation.model';
import { DatabaseError, NotFoundError } from '@/lib/utils/errors';

/**
 * 对话数据访问层
 * 封装所有对话相关的数据库操作
 */
export class ConversationRepository {
  /**
   * 创建或获取对话
   * 如果对话已存在则返回现有对话
   */
  async createOrGet(pdfId: string, userId: string): Promise<Conversation> {
    try {
      const supabase = await createClient();

      // 先查找现有对话
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('pdf_id', pdfId)
        .eq('user_id', userId)
        .single();

      if (!findError && existing) {
        return mapDbToConversation(existing);
      }

      // 创建新对话
      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          pdf_id: pdfId,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) {
        throw new DatabaseError(`Failed to create conversation: ${createError.message}`);
      }

      return mapDbToConversation(conversation);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create or get conversation');
    }
  }

  /**
   * 根据 ID 获取对话
   */
  async findById(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Failed to fetch conversation: ${error.message}`);
      }

      return mapDbToConversation(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch conversation');
    }
  }

  /**
   * 根据 PDF ID 获取对话
   */
  async findByPdfId(pdfId: string, userId: string): Promise<Conversation | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('pdf_id', pdfId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Failed to fetch conversation: ${error.message}`);
      }

      return mapDbToConversation(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch conversation');
    }
  }

  /**
   * 获取对话消息列表
   */
  async getMessages(
    conversationId: string,
    options: MessageListOptions = {}
  ): Promise<{ messages: Message[]; total: number }> {
    try {
      const supabase = await createClient();
      const {
        limit = 50,
        offset = 0,
        sortOrder = 'asc',
      } = options;

      const { data, error, count } = await supabase
        .from('conversation_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new DatabaseError(`Failed to fetch messages: ${error.message}`);
      }

      return {
        messages: data.map(mapDbToMessage),
        total: count || 0,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to fetch messages');
    }
  }

  /**
   * 添加消息
   */
  async addMessage(data: CreateMessageData): Promise<Message> {
    try {
      const supabase = await createClient();

      const { data: message, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: data.conversationId,
          pdf_id: data.pdfId,
          user_id: data.userId,
          role: data.role,
          content: data.content,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to add message: ${error.message}`);
      }

      // 更新对话的 updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.conversationId);

      return mapDbToMessage(message);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to add message');
    }
  }

  /**
   * 批量添加消息（用于导入历史）
   */
  async addMessages(messages: CreateMessageData[]): Promise<Message[]> {
    try {
      const supabase = await createClient();

      const messagesToInsert = messages.map((msg) => ({
        conversation_id: msg.conversationId,
        pdf_id: msg.pdfId,
        user_id: msg.userId,
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert(messagesToInsert)
        .select();

      if (error) {
        throw new DatabaseError(`Failed to add messages: ${error.message}`);
      }

      return data.map(mapDbToMessage);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to add messages');
    }
  }

  /**
   * 获取对话统计
   */
  async getStats(conversationId: string, userId: string): Promise<ConversationStats> {
    try {
      const supabase = await createClient();

      // 验证对话所有权
      const conversation = await this.findById(conversationId, userId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const { count, data } = await supabase
        .from('conversation_messages')
        .select('created_at', { count: 'exact', head: false })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        messageCount: count || 0,
        lastMessageAt:
          data && data.length > 0 ? new Date(data[0].created_at) : null,
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to get conversation stats');
    }
  }

  /**
   * 删除对话及其消息
   */
  async delete(conversationId: string, userId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // 先删除消息（如果没有级联删除）
      await supabase
        .from('conversation_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // 再删除对话
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(`Failed to delete conversation: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete conversation');
    }
  }

  /**
   * 根据 PDF ID 删除所有对话
   */
  async deleteByPdf(pdfId: string, userId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // 获取该 PDF 的所有对话
      const { data: conversations, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('pdf_id', pdfId)
        .eq('user_id', userId);

      if (findError) {
        throw new DatabaseError(`Failed to find conversations: ${findError.message}`);
      }

      if (!conversations || conversations.length === 0) {
        return;
      }

      const conversationIds = conversations.map((c) => c.id);

      // 删除消息
      await supabase
        .from('conversation_messages')
        .delete()
        .in('conversation_id', conversationIds);

      // 删除对话
      const { error } = await supabase
        .from('conversations')
        .delete()
        .in('id', conversationIds);

      if (error) {
        throw new DatabaseError(`Failed to delete conversations: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete conversations by PDF');
    }
  }

  /**
   * 获取对话完整内容（包含消息）
   */
  async getWithMessages(
    conversationId: string,
    userId: string,
    options?: MessageListOptions
  ): Promise<ConversationWithMessages | null> {
    const conversation = await this.findById(conversationId, userId);
    if (!conversation) return null;

    const { messages } = await this.getMessages(conversationId, options);

    return {
      ...conversation,
      messages,
    };
  }
}
