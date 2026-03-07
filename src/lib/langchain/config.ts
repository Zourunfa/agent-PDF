/**
 * LangChain and Qwen (通义千问) configuration
 */

import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";

// Get API key from environment (千问 API Key)
const apiKey = process.env.QWEN_API_KEY || "sk-d2705e3b0ddb48e2a0fd26fbcd1e1535";

if (!apiKey) {
  console.warn("QWEN_API_KEY not found in environment variables");
}

/**
 * Chat model configuration - 使用通义千问
 */
export const chatModel = new ChatAlibabaTongyi({
  alibabaApiKey: apiKey,
  modelName: process.env.QWEN_MODEL || "qwen-turbo", // qwen-turbo, qwen-plus, qwen-max
  temperature: 0.7,
  streaming: true,
});

/**
 * Embeddings configuration - 使用通义千问嵌入
 */
export const embeddings = new AlibabaTongyiEmbeddings({
  apiKey: apiKey,
  modelName: "text-embedding-v2" as const,
});

/**
 * Alternative: 如果需要使用 OpenAI 兼容的接口
 */
export const fallbackChatModel = chatModel;
export const fallbackEmbeddings = embeddings;
