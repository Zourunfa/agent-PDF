/**
 * Conversation History Retrieval Utilities
 * Handles fetching conversation messages and history
 */

import { createClient } from '@/lib/supabase/server';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  tokens?: number;
  processingTime?: number;
}

export interface ConversationHistoryResult {
  pdfId: string;
  filename: string;
  pageCount: number | null;
  messages: ConversationMessage[];
  total: number;
}

export interface GetConversationHistoryParams {
  pdfId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * Get conversation history for a PDF
 */
export async function getConversationHistory(
  params: GetConversationHistoryParams
): Promise<ConversationHistoryResult> {
  const supabase = createClient();
  const { pdfId, userId, limit = 100, offset = 0 } = params;

  console.log('[getConversationHistory] Fetching conversation history:', {
    pdfId,
    userId,
    limit,
    offset,
  });

  try {
    // Validate parameters
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    // First, verify user owns the PDF
    const { data: pdfData, error: pdfError } = await supabase
      .from('user_pdfs')
      .select('id, filename, page_count')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (pdfError) {
      if (pdfError.code === 'PGRST116') {
        throw new Error('PDF not found or access denied');
      }
      throw pdfError;
    }

    console.log('[getConversationHistory] PDF verified:', (pdfData as any).filename);

    // Fetch conversation messages
    const { data: messages, error: messagesError, count } = await supabase
      .from('conversation_messages')
      .select('id, role, content, created_at, tokens, processing_time', {
        count: 'exact',
      })
      .eq('pdf_id', pdfId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) throw messagesError;

    console.log('[getConversationHistory] Found', count, 'total messages');

    // Transform messages
    const transformedMessages: ConversationMessage[] = (messages as any[] || []).map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at,
      tokens: msg.tokens,
      processingTime: msg.processing_time,
    }));

    return {
      pdfId,
      filename: (pdfData as any).filename,
      pageCount: (pdfData as any).page_count,
      messages: transformedMessages,
      total: count || 0,
    };
  } catch (error) {
    console.error('[getConversationHistory] Error fetching history:', error);
    throw error;
  }
}

/**
 * Get recent messages from a conversation
 */
export async function getRecentMessages(
  pdfId: string,
  userId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  const supabase = createClient();

  console.log('[getRecentMessages] Fetching recent messages:', {
    pdfId,
    userId,
    limit,
  });

  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('id, role, content, created_at, tokens, processing_time')
      .eq('pdf_id', pdfId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Reverse to get chronological order
    const messages: ConversationMessage[] = (data as any[] || [])
      .reverse()
      .map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
        tokens: msg.tokens,
        processingTime: msg.processing_time,
      }));

    console.log('[getRecentMessages] Found', messages.length, 'recent messages');

    return messages;
  } catch (error) {
    console.error('[getRecentMessages] Error fetching recent messages:', error);
    throw error;
  }
}

/**
 * Get conversation message count
 */
export async function getConversationMessageCount(
  pdfId: string,
  userId: string
): Promise<number> {
  const supabase = createClient();

  console.log('[getConversationMessageCount] Getting message count:', { pdfId, userId });

  try {
    const { count, error } = await supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .eq('pdf_id', pdfId)
      .eq('user_id', userId);

    if (error) throw error;

    console.log('[getConversationMessageCount] Message count:', count);

    return count || 0;
  } catch (error) {
    console.error('[getConversationMessageCount] Error getting message count:', error);
    throw error;
  }
}

/**
 * Search messages in a conversation
 */
export async function searchConversationMessages(
  pdfId: string,
  userId: string,
  searchTerm: string,
  limit: number = 20
): Promise<ConversationMessage[]> {
  const supabase = createClient();

  console.log('[searchConversationMessages] Searching messages:', {
    pdfId,
    userId,
    searchTerm,
    limit,
  });

  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('id, role, content, created_at, tokens, processing_time')
      .eq('pdf_id', pdfId)
      .eq('user_id', userId)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const messages: ConversationMessage[] = (data as any[] || [])
      .reverse()
      .map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
        tokens: msg.tokens,
        processingTime: msg.processing_time,
      }));

    console.log('[searchConversationMessages] Found', messages.length, 'matching messages');

    return messages;
  } catch (error) {
    console.error('[searchConversationMessages] Error searching messages:', error);
    throw error;
  }
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(
  pdfId: string,
  userId: string
): Promise<{
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  totalTokens: number;
  averageProcessingTime: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
}> {
  const supabase = createClient();

  console.log('[getConversationStats] Getting conversation stats:', { pdfId, userId });

  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('role, tokens, processing_time, created_at')
      .eq('pdf_id', pdfId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages = (data as any[]) || [];
    const messageCount = messages.length;
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    const assistantMessageCount = messages.filter((m: any) => m.role === 'assistant').length;
    const totalTokens = messages.reduce((sum: number, m: any) => sum + (m.tokens || 0), 0);
    const processingTimes = messages
      .filter((m: any) => m.processing_time)
      .map((m: any) => m.processing_time);
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a: number, b: number) => a + b, 0) / processingTimes.length
        : 0;

    const stats = {
      messageCount,
      userMessageCount,
      assistantMessageCount,
      totalTokens,
      averageProcessingTime: Math.round(averageProcessingTime),
      firstMessageAt: messages.length > 0 ? messages[0].created_at : null,
      lastMessageAt: messages.length > 0 ? messages[messages.length - 1].created_at : null,
    };

    console.log('[getConversationStats] Stats:', stats);

    return stats;
  } catch (error) {
    console.error('[getConversationStats] Error getting stats:', error);
    throw error;
  }
}
