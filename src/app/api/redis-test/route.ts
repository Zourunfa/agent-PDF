/**
 * Redis Connection Test API
 */

import { NextResponse } from "next/server";
import { checkRedisConnection } from "@/lib/storage/redis-cache";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Redis Test] Testing connection...');
    
    const isConnected = await checkRedisConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "Redis connection successful",
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Redis connection failed",
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Redis Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
