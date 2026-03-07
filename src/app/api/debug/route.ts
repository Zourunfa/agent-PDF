/**
 * Debug API - Check system status
 */

import { NextResponse } from "next/server";
import { getVectorStoreIds } from "@/lib/langchain/vector-store";

export async function GET() {
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
