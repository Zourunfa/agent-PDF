/**
 * Chat API Route with SSE streaming
 */

import { NextRequest } from "next/server";
import { chatModel } from "@/lib/langchain/config";
import { searchSimilarDocuments, getVectorStoreIds } from "@/lib/langchain/vector-store";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Document as LangChainDocument } from "@langchain/core/documents";

export async function POST(req: NextRequest) {
  const { pdfId, question, conversationId, history } = await req.json();

  console.log(`[Chat API] Received chat request for PDF: ${pdfId}, question: "${question}"`);
  console.log(`[Chat API] Current vector stores: ${getVectorStoreIds().join(', ')}`);

  if (!pdfId || !question) {
    return new Response(
      JSON.stringify({
        type: "error",
        error: {
          code: "INVALID_REQUEST",
          message: "缺少必要参数",
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageId = conversationId + "-" + Date.now();
        const startTime = Date.now();

        // Send start event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "start",
              messageId,
            })}\n\n`
          )
        );

        // Search for relevant context
        console.log(`[Chat API] Searching for relevant documents...`);
        console.log(`[Chat API] Available vector stores: ${getVectorStoreIds().join(', ')}`);

        let relevantDocs: LangChainDocument[] = [];
        try {
          relevantDocs = await searchSimilarDocuments(pdfId, question, 4);
          console.log(`[Chat API] Found ${relevantDocs.length} relevant documents`);
        } catch (searchError) {
          console.error(`[Chat API] Vector search error:`, searchError);
        }

        if (relevantDocs.length === 0) {
          console.warn(`[Chat API] No relevant documents found for PDF ${pdfId}`);
          const hasVectorStore = getVectorStoreIds().includes(pdfId);
          const errorMsg = hasVectorStore
            ? "抱歉，我在文档中没有找到与您问题相关的内容。请尝试用不同的方式描述您的问题，或者检查文档是否包含相关信息。"
            : "抱歉，文档尚未完成解析或解析失败。请等待文档解析完成后再试，或者重新上传文档。";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "token",
                content: errorMsg,
                messageId,
              })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "end",
                messageId,
                metadata: {
                  tokenCount: 0,
                  processingTime: Date.now() - startTime,
                  modelUsed: "qwen-turbo",
                  sourcesFound: 0,
                  hasVectorStore,
                },
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Format context from relevant documents
        const context = relevantDocs.map((doc, i) => {
          const metadata = doc.metadata as Record<string, unknown>;
          return `[文档片段 ${i + 1}]:\n${doc.pageContent}`;
        }).join("\n\n");

        console.log(`[Chat API] Found ${relevantDocs.length} relevant documents`);

        // Create messages for the chat model
        const systemMessage = new SystemMessage(
          `你是一个智能文档助手。请根据以下文档内容回答用户的问题。如果文档中没有相关信息，请明确告知用户。\n\n文档内容：\n${context}`
        );

        const userMessage = new HumanMessage(question);

        // Stream response from Qwen
        console.log(`[Chat API] Calling Qwen API...`);
        const response = await chatModel.stream([systemMessage, userMessage]);

        let tokenCount = 0;

        // Stream tokens
        for await (const token of response) {
          const content = token.content as string;
          if (content) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "token",
                  content: content,
                  messageId,
                })}\n\n`
              )
            );
            tokenCount++;
          }
        }

        const processingTime = Date.now() - startTime;
        console.log(`[Chat API] Response completed: ${tokenCount} tokens in ${processingTime}ms`);

        // Send end event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "end",
              messageId,
              metadata: {
                tokenCount,
                processingTime,
                modelUsed: "qwen-turbo",
                sourcesFound: relevantDocs.length,
              },
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error("[Chat API] Error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: {
                code: "AI_SERVICE_ERROR",
                message: error instanceof Error ? error.message : "对话服务暂时不可用",
              },
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
