/**
 * Debug API - Check system status
 */

import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Lazy load vector store to avoid build-time execution
  const { getVectorStoreIds } = await import("@/lib/langchain/vector-store");
  const vectorStoreIds = getVectorStoreIds();
  
  return NextResponse.json({
    success: true,
    data: {
      vectorStores: {
        count: vectorStoreIds.length,
        ids: vectorStoreIds,
      },
      environment: {
        hasAlibabaKey: !!process.env.ALIBABA_API_KEY,
        hasQwenKey: !!process.env.QWEN_API_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
