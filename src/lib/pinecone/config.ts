/**
 * Pinecone Vector Database Configuration
 * 
 * Pinecone 是一个完全托管的向量数据库，专为 AI 应用设计
 * 免费版提供：1个索引，100K向量，足够个人项目使用
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone API Key
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'pdf-chat';

// Check if Pinecone is configured
export const isPineconeConfigured = !!PINECONE_API_KEY;

// Log configuration status
if (isPineconeConfigured) {
  console.log('✓ Pinecone configured for vector storage');
} else {
  console.warn('⚠️ Pinecone not configured, will use in-memory storage');
  console.warn('⚠️ Get free API key at: https://www.pinecone.io/');
}

/**
 * Global Pinecone client singleton
 */
let pineconeClient: Pinecone | null = null;

/**
 * Get Pinecone client instance
 */
export function getPineconeClient(): Pinecone {
  if (!PINECONE_API_KEY) {
    throw new Error('PINECONE_NOT_CONFIGURED: Please set PINECONE_API_KEY in environment variables');
  }

  if (!pineconeClient) {
    console.log('[Pinecone] Initializing client...');
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
    console.log('[Pinecone] ✓ Client initialized');
  }

  return pineconeClient;
}

/**
 * Get Pinecone index
 */
export function getPineconeIndex() {
  const client = getPineconeClient();
  const index = client.index(PINECONE_INDEX_NAME);
  console.log(`[Pinecone] Using index: ${PINECONE_INDEX_NAME}`);
  return index;
}

/**
 * Get index name
 */
export function getIndexName(): string {
  return PINECONE_INDEX_NAME;
}
