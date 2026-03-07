/**
 * LangChain configuration - supports Qwen and Voyage AI (Claude-compatible embeddings)
 */

import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";

// Get API keys from environment - prioritize Qwen
const qwenApiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY || "";
const voyageApiKey = ""; // Force disable Voyage AI to use Qwen

// Check if API key is configured
export const isApiKeyConfigured = !!qwenApiKey || !!voyageApiKey;

// Log which embedding model is being used
if (qwenApiKey) {
  console.log("✓ Using Qwen (Alibaba Tongyi) for embeddings");
} else if (voyageApiKey) {
  console.log("✓ Using Voyage AI for embeddings (Claude-compatible)");
} else {
  console.error("⚠️ No Embedding API Key found! Please set ALIBABA_API_KEY or QWEN_API_KEY");
}

/**
 * Get chat model - throws error if not configured
 */
export function getChatModel() {
  if (!qwenApiKey) {
    throw new Error("AI_NOT_CONFIGURED: Please configure ALIBABA_API_KEY or QWEN_API_KEY in environment variables");
  }
  
  return new ChatAlibabaTongyi({
    alibabaApiKey: qwenApiKey,
    modelName: process.env.QWEN_MODEL || "qwen-turbo",
    temperature: 0.7,
    streaming: true,
  });
}

/**
 * Get embeddings - throws error if not configured
 */
export function getEmbeddings() {
  if (!qwenApiKey && !voyageApiKey) {
    throw new Error("AI_NOT_CONFIGURED: Please configure ALIBABA_API_KEY or QWEN_API_KEY in environment variables");
  }
  
  return voyageApiKey
    ? new VoyageEmbeddings({
        apiKey: voyageApiKey,
        modelName: "voyage-3",
        inputType: "document",
      })
    : new AlibabaTongyiEmbeddings({
        apiKey: qwenApiKey,
        modelName: "text-embedding-v2" as const,
      });
}

/**
 * Legacy exports for backward compatibility
 */
export const chatModel = qwenApiKey ? getChatModel() : null as any;
export const embeddings = (qwenApiKey || voyageApiKey) ? getEmbeddings() : null as any;
