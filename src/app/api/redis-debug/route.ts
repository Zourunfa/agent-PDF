/**
 * Redis Debug API - Check Redis data
 */

import { NextResponse } from "next/server";
import { getAllPDFIds, getPDF, getVectorChunks, checkRedisConnection } from "@/lib/storage/redis-cache";

export async function GET() {
  try {
    console.log('[Redis Debug] Starting debug check...');
    
    // Check connection
    const isConnected = await checkRedisConnection();
    console.log('[Redis Debug] Connection:', isConnected);
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Redis connection failed",
        envVars: {
          hasUrl: !!process.env.KV_REST_API_URL || !!process.env.UPSTASH_REDIS_REST_URL,
          hasToken: !!process.env.KV_REST_API_TOKEN || !!process.env.UPSTASH_REDIS_REST_TOKEN,
          url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)?.substring(0, 30) + '...',
        }
      }, { status: 500 });
    }
    
    // Get all PDF IDs
    const pdfIds = await getAllPDFIds();
    console.log('[Redis Debug] PDF IDs:', pdfIds);
    
    // Get details for each PDF
    const pdfs = [];
    for (const id of pdfIds) {
      const pdf = await getPDF(id);
      const chunks = await getVectorChunks(id);
      
      pdfs.push({
        id,
        fileName: pdf?.fileName,
        parseStatus: pdf?.parseStatus,
        textLength: pdf?.textContent?.length || 0,
        hasVectorChunks: !!chunks,
        chunkCount: chunks?.length || 0,
      });
    }
    
    return NextResponse.json({
      success: true,
      connected: isConnected,
      pdfCount: pdfIds.length,
      pdfs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Redis Debug] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
