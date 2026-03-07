/**
 * LangChain configuration - supports Qwen and Voyage AI (Claude-compatible embeddings)
 */

import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";

// Get API keys from environment - prioritize Qwen
const qwenApiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY || "";
const voyageApiKey = ""; // Force disable Voyage AI to use Qwen

// Log which embedding model is being used
if (qwenApiKey) {
  console.log("✓ Using Qwen (Alibaba Tongyi) for embeddings");
} else if (voyageApiKey) {
  console.log("✓ Using Voyage AI for embeddings (Claude-compatible)");
} else {
  console.error("⚠️ No Embedding API Key found! Please set ALIBABA_API_KEY or QWEN_API_KEY");
}

/**
 * Chat model configuration - 使用通义千问
 */
export const chatModel = new ChatAlibabaTongyi({
  alibabaApiKey: qwenApiKey,
  modelName: process.env.QWEN_MODEL || "qwen-turbo",
  temperature: 0.7,
  streaming: true,
});

/**
 * Embeddings configuration - Priority: Voyage AI > Qwen
 * Voyage AI provides Claude-compatible embeddings
 */
export const embeddings = voyageApiKey
  ? new VoyageEmbeddings({
      apiKey: voyageApiKey,
      modelName: "voyage-3", // Latest embedding model, Claude-compatible
      inputType: "document",
    })
  : new AlibabaTongyiEmbeddings({
      apiKey: qwenApiKey,
      modelName: "text-embedding-v2" as const,
    });

/**
 * Fallback models
 */
export const fallbackChatModel = chatModel;
export const fallbackEmbeddings = embeddings;
