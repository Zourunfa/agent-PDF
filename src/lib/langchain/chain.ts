/**
 * LangChain QA Chain configuration
 */

import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { chatModel } from "./config";
import { getVectorStore } from "./vector-store";

/**
 * Create QA chain for a specific PDF
 */
export async function createQAChain(
  pdfId: string,
  options?: {
    temperature?: number;
    returnSourceDocuments?: boolean;
  }
): Promise<ConversationalRetrievalQAChain | null> {
  const vectorStore = await getVectorStore(pdfId);
  if (!vectorStore) {
    return null;
  }

  const retriever = vectorStore.asRetriever(4);

  const chain = ConversationalRetrievalQAChain.fromLLM(
    chatModel,
    retriever,
    {
      returnSourceDocuments: options?.returnSourceDocuments ?? false,
      verbose: process.env.LOG_LEVEL === "debug",
    }
  );

  return chain;
}

/**
 * Format chat history for LangChain
 */
export function formatChatHistory(
  history: Array<{ role: string; content: string }>
): Array<[string, string]> {
  return history
    .filter((msg) => msg.role !== "system")
    .map((msg) => {
      if (msg.role === "user") {
        return [msg.content, ""] as [string, string];
      } else {
        // This assumes alternating user/assistant messages
        return ["", msg.content] as [string, string];
      }
    })
    .reduce((acc: Array<[string, string]>, curr) => {
      // Merge consecutive pairs
      if (acc.length === 0) {
        return [curr];
      }
      const last = acc[acc.length - 1];
      if (last[1] === "" && curr[0] !== "") {
        last[1] = curr[0];
      } else if (curr[1] !== "") {
        acc.push(curr);
      }
      return acc;
    }, []);
}
