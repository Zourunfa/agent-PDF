/**
 * Session storage utilities for client-side persistence
 */

import { ChatMessage, Conversation } from "@/types/chat";
import { PDFFile } from "@/types/pdf";

const STORAGE_KEYS = {
  PDFS: "pdf_chat_pdfs",
  ACTIVE_PDF: "pdf_chat_active_pdf",
  CONVERSATIONS: "pdf_chat_conversations",
  ACTIVE_CONVERSATION: "pdf_chat_active_conversation",
} as const;

/**
 * Check if running in browser
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * PDF storage
 */
export const pdfStorage = {
  getAll: (): PDFFile[] => {
    if (!isBrowser()) return [];
    const data = sessionStorage.getItem(STORAGE_KEYS.PDFS);
    return data ? JSON.parse(data) : [];
  },

  setAll: (pdfs: PDFFile[]): void => {
    if (!isBrowser()) return;
    sessionStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(pdfs));
  },

  add: (pdf: PDFFile): void => {
    const pdfs = pdfStorage.getAll();
    pdfs.push(pdf);
    pdfStorage.setAll(pdfs);
  },

  remove: (pdfId: string): void => {
    const pdfs = pdfStorage.getAll().filter((p) => p.id !== pdfId);
    pdfStorage.setAll(pdfs);
  },

  getActivePdfId: (): string | null => {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_PDF);
  },

  setActivePdfId: (pdfId: string | null): void => {
    if (!isBrowser()) return;
    if (pdfId) {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_PDF, pdfId);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_PDF);
    }
  },
};

/**
 * Conversation storage
 */
export const conversationStorage = {
  getAll: (): Record<string, ChatMessage[]> => {
    if (!isBrowser()) return {};
    const data = sessionStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : {};
  },

  setAll: (conversations: Record<string, ChatMessage[]>): void => {
    if (!isBrowser()) return;
    sessionStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  },

  getMessages: (conversationId: string): ChatMessage[] => {
    const conversations = conversationStorage.getAll();
    return conversations[conversationId] || [];
  },

  setMessages: (conversationId: string, messages: ChatMessage[]): void => {
    const conversations = conversationStorage.getAll();
    conversations[conversationId] = messages;
    conversationStorage.setAll(conversations);
  },

  addMessage: (conversationId: string, message: ChatMessage): void => {
    const messages = conversationStorage.getMessages(conversationId);
    messages.push(message);
    conversationStorage.setMessages(conversationId, messages);
  },

  clearConversation: (conversationId: string): void => {
    const conversations = conversationStorage.getAll();
    delete conversations[conversationId];
    conversationStorage.setAll(conversations);
  },

  getActiveConversationId: (): string | null => {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
  },

  setActiveConversationId: (conversationId: string | null): void => {
    if (!isBrowser()) return;
    if (conversationId) {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, conversationId);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    }
  },
};

/**
 * Clear all session data
 */
export function clearAllSessionData(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
  });
}
