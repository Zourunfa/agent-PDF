/**
 * Chat API Route with SSE streaming
 */

import { NextRequest } from "next/server";
import { createQAChain, formatChatHistory } from "@/lib/langchain/chain";
import { searchSimilarDocuments } from "@/lib/langchain/vector-store";

export async function POST(req: NextRequest) {
  const { pdfId, question, conversationId, history } = await req.json();

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
        const relevantDocs = await searchSimilarDocuments(pdfId, question, 4);

        if (relevantDocs.length === 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "token",
                content: "抱歉，我没有找到相关的文档内容。请尝试重新表述您的问题。",
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
                  processingTime: 0,
                  modelUsed: "gpt-3.5-turbo",
                },
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Format context
        const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

        // Simulate streaming response (in production, use actual AI streaming)
        const response = `根据文档内容，以下是关于您问题的回答：\n\n${context}`;

        // Stream response
        const tokens = response.split(" ");
        for (const token of tokens) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "token",
                content: token + " ",
                messageId,
              })}\n\n`
            )
          );
          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Send end event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "end",
              messageId,
              metadata: {
                tokenCount: tokens.length,
                processingTime: 500,
                modelUsed: "gpt-3.5-turbo",
              },
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error("Chat error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: {
                code: "AI_SERVICE_ERROR",
                message: "对话服务暂时不可用",
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
