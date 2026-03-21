/**
 * Conversation Saving Utilities
 * Handles saving conversation messages and updating conversation stats
 */

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export interface SaveConversationMessageParams {
  conversationId: string;
  pdfId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  processingTime?: number;
}

export interface UpdateConversationStatsParams {
  conversationId: string;
  userId: string;
}

/**
 * Save a conversation message
 */
export async function saveConversationMessage(
  params: SaveConversationMessageParams
): Promise<string> {
  const supabase = createClient();
  const {
    conversationId,
    pdfId,
    userId,
    role,
    content,
    tokens,
    processingTime,
  } = params;

  console.log('[saveConversationMessage] Saving message:', {
    conversationId,
    pdfId,
    role,
    contentLength: content.length,
    tokens,
    processingTime,
  });

  try {
    const messageId = uuidv4();

    const { error } = await supabase
      .from('conversation_messages')
      .insert(
        [
          {
            id: messageId,
            conversation_id: conversationId,
            pdf_id: pdfId,
            user_id: userId,
            role,
            content,
            tokens,
            processing_time: processingTime,
          },
        ] as any
      );

    if (error) throw error;
    console.log('[saveConversationMessage] Message saved successfully:', messageId);

    return messageId;
  } catch (error) {
    console.error('[saveConversationMessage] Error saving message:', error);
    throw error;
  }
}

/**
 * Save both user question and assistant response
 * This is a convenience function for typical Q&A flow
 */
export async function saveConversationExchange(
  conversationId: string,
  pdfId: string,
  userId: string,
  userQuestion: string,
  assistantResponse: string,
  assistantTokens?: number,
  assistantProcessingTime?: number
): Promise<{ userMessageId: string; assistantMessageId: string }> {
  console.log('[saveConversationExchange] Saving Q&A exchange:', {
    conversationId,
    pdfId,
    userQuestionLength: userQuestion.length,
    assistantResponseLength: assistantResponse.length,
  });

  try {
    // Save user message
    const userMessageId = await saveConversationMessage({
      conversationId,
      pdfId,
      userId,
      role: 'user',
      content: userQuestion,
    });

    // Save assistant message
    const assistantMessageId = await saveConversationMessage({
      conversationId,
      pdfId,
      userId,
      role: 'assistant',
      content: assistantResponse,
      tokens: assistantTokens,
      processingTime: assistantProcessingTime,
    });

    console.log('[saveConversationExchange] Exchange saved successfully');

    return { userMessageId, assistantMessageId };
  } catch (error) {
    console.error('[saveConversationExchange] Error saving exchange:', error);
    throw error;
  }
}

/**
 * Get conversation stats
 */
export async function getConversationStats(
  conversationId: string,
  userId: string
): Promise<{
  messageCount: number;
  lastMessageAt: string | null;
}> {
  const supabase = createClient();

  console.log('[getConversationStats] Getting stats for conversation:', conversationId);

  try {
    const { data, error } = await supabase
      .from('pdf_conversations')
      .select('message_count, last_message_at')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    console.log('[getConversationStats] Stats retrieved:', data);

    return {
      messageCount: (data as any)?.message_count || 0,
      lastMessageAt: (data as any)?.last_message_at || null,
    };
  } catch (error) {
    console.error('[getConversationStats] Error getting stats:', error);
    throw error;
  }
}

/**
 * Get total tokens used in a conversation
 */
export async function getConversationTokenCount(
  conversationId: string,
  userId: string
): Promise<number> {
  const supabase = createClient();

  console.log('[getConversationTokenCount] Getting token count for conversation:', conversationId);

  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('tokens')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .not('tokens', 'is', null);

    if (error) throw error;

    const totalTokens = (data as any[] || []).reduce((sum, msg) => sum + (msg.tokens || 0), 0);

    console.log('[getConversationTokenCount] Total tokens:', totalTokens);

    return totalTokens;
  } catch (error) {
    console.error('[getConversationTokenCount] Error getting token count:', error);
    throw error;
  }
}

/**
 * Delete all messages in a conversation
 */
export async function deleteConversationMessages(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  console.log('[deleteConversationMessages] Deleting messages for conversation:', conversationId);

  try {
    const { error } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    console.log('[deleteConversationMessages] Messages deleted successfully');
  } catch (error) {
    console.error('[deleteConversationMessages] Error deleting messages:', error);
    throw error;
  }
}
