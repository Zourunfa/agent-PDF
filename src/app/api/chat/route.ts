/**
 * Chat API Route with SSE streaming
 */

import { NextRequest } from "next/server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Document as LangChainDocument } from "@langchain/core/documents";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Lazy load LangChain config to avoid build-time execution
  const { getChatModel, isApiKeyConfigured } = await import("@/lib/langchain/config");
  const { searchSimilarDocuments, getVectorStoreIds } = await import("@/lib/langchain/vector-store");
  
  const { pdfId, question, conversationId, history, pdfTextContent, pdfPageCount } = await req.json();

  console.log(`[Chat API] Received chat request for PDF: ${pdfId}, question: "${question}"`);
  console.log(`[Chat API] API Key configured: ${isApiKeyConfigured}`);
  
  // Check if API key is configured
  if (!isApiKeyConfigured) {
    return new Response(
      JSON.stringify({
        type: "error",
        error: {
          code: "AI_NOT_CONFIGURED",
          message: "AI 服务未配置。请在 Vercel 环境变量中设置 ALIBABA_API_KEY 或 QWEN_API_KEY。",
        },
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  
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
        const vectorStoreIds = getVectorStoreIds();
        console.log(`[Chat API] Available vector stores: ${vectorStoreIds.join(', ')}`);
        console.log(`[Chat API] Looking for PDF: ${pdfId}`);
        console.log(`[Chat API] Vector store exists: ${vectorStoreIds.includes(pdfId)}`);

        let relevantDocs: LangChainDocument[] = [];
        
        // Check if vector store exists
        const hasVectorStore = vectorStoreIds.includes(pdfId);
        
        if (!hasVectorStore) {
          console.log(`[Chat API] ⚠️ Vector store not found, attempting to recreate...`);
          try {
            const { getPDFFile } = await import("@/lib/storage/pdf-files");
            const { splitTextWithMetadata } = await import("@/lib/pdf/text-splitter");
            const { createVectorStoreFromChunks } = await import("@/lib/langchain/vector-store");

            let textToUse: string | null = null;
            let pageCountToUse = 0;

            // First, try to use text content from client (for Vercel serverless)
            if (pdfTextContent) {
              console.log(`[Chat API] ✓ Using PDF text from client request (${pdfTextContent.length} chars)`);
              textToUse = pdfTextContent;
              pageCountToUse = pdfPageCount || 0;
            } else {
              // Fallback: Try to load from server storage (works in local dev)
              console.log(`[Chat API] Checking PDF file storage...`);
              const pdfFile = await getPDFFile(pdfId);
              console.log(`[Chat API] PDF file found: ${!!pdfFile}`);

              if (pdfFile) {
                console.log(`[Chat API] PDF details:`, {
                  fileName: pdfFile.fileName,
                  hasTextContent: !!pdfFile.textContent,
                  textLength: pdfFile.textContent?.length || 0,
                  pageCount: pdfFile.pageCount,
                });
              }

              if (pdfFile && pdfFile.textContent) {
                console.log(`[Chat API] ✓ Found PDF text in storage (${pdfFile.textContent.length} chars)`);
                textToUse = pdfFile.textContent;
                pageCountToUse = pdfFile.pageCount || 0;
              }
            }

            if (textToUse) {
              console.log(`[Chat API] ✓ Recreating vector store with ${textToUse.length} chars...`);
              const chunks = await splitTextWithMetadata(
                textToUse,
                { pdfId, source: "pdf", pageCount: pageCountToUse }
              );
              console.log(`[Chat API] ✓ Created ${chunks.length} chunks`);
              await createVectorStoreFromChunks(pdfId, chunks);
              console.log(`[Chat API] ✓ Vector store recreated successfully`);
              console.log(`[Chat API] ✓ New vector stores: ${getVectorStoreIds().join(', ')}`);
            } else {
              console.error(`[Chat API] ✗ No PDF text content available`);
              console.error(`[Chat API] ✗ Client should send pdfTextContent, or storage should have the text`);
            }
          } catch (recreateError) {
            console.error(`[Chat API] ✗ Failed to recreate vector store:`, recreateError);
            if (recreateError instanceof Error) {
              console.error(`[Chat API] ✗ Error details:`, recreateError.message);
              console.error(`[Chat API] ✗ Stack:`, recreateError.stack);
            }
          }
        } else {
          console.log(`[Chat API] ✓ Vector store exists in memory`);
        }
        
        // Now try to search
        try {
          relevantDocs = await searchSimilarDocuments(pdfId, question, 4);
          console.log(`[Chat API] Found ${relevantDocs.length} relevant documents`);
        } catch (searchError) {
          console.error(`[Chat API] Vector search error:`, searchError);
        }

        if (relevantDocs.length === 0) {
          console.warn(`[Chat API] No relevant documents found for PDF ${pdfId}`);
          const errorMsg = "抱歉，无法找到文档内容。文档可能未完成解析，或者服务器已重启导致数据丢失。请重新上传文档。";

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
        const chatModel = getChatModel();
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
