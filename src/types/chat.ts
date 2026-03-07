/**
 * Chat entity types
 */

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  pdfId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming: boolean;
  metadata: MessageMetadata | null;
}

export interface MessageMetadata {
  tokenCount?: number;
  processingTime?: number;
  modelUsed?: string;
  sources?: CitationSource[];
}

export interface CitationSource {
  page: number;
  content: string;
}

export interface Conversation {
  id: string;
  pdfId: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  isStreaming: boolean;
}

export interface VectorDocument {
  id: string;
  pdfId: string;
  content: string;
  metadata: Record<string, unknown>;
}
