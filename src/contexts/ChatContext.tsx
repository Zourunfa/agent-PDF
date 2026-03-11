/**
 * Chat Context Provider
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage, MessageRole } from '@/types/chat';

interface ChatContextType {
  conversations: Map<string, ChatMessage[]>;
  activeConversationId: string | null;
  isStreaming: boolean;

  // Actions
  addMessage: (conversationId: string, message: ChatMessage) => void;
  loadMessages: (conversationId: string, messages: ChatMessage[]) => void;
  clearConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setStreaming: (isStreaming: boolean) => void;
  updateStreamingMessage: (conversationId: string, content: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [conversations, setConversations] = useState<Map<string, ChatMessage[]>>(new Map());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const addMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setConversations((prev) => {
      const messages = prev.get(conversationId) || [];
      return new Map(prev).set(conversationId, [...messages, message]);
    });
  }, []);

  const loadMessages = useCallback((conversationId: string, messages: ChatMessage[]) => {
    setConversations((prev) => new Map(prev).set(conversationId, messages));
  }, []);

  const clearConversation = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const next = new Map(prev);
      next.set(conversationId, []);
      return next;
    });
  }, []);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
  }, []);

  const setStreaming = useCallback((isStreaming: boolean) => {
    setIsStreaming(isStreaming);
  }, []);

  const updateStreamingMessage = useCallback((conversationId: string, content: string) => {
    setConversations((prev) => {
      const messages = prev.get(conversationId) || [];
      if (messages.length === 0) return prev;

      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === MessageRole.ASSISTANT && lastMessage.isStreaming) {
        const updated = [...messages];
        updated[updated.length - 1] = {
          ...lastMessage,
          content,
        };
        return new Map(prev).set(conversationId, updated);
      }
      return prev;
    });
  }, []);

  const value: ChatContextType = {
    conversations,
    activeConversationId,
    isStreaming,
    addMessage,
    loadMessages,
    clearConversation,
    setActiveConversation,
    setStreaming,
    updateStreamingMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
