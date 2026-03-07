/**
 * Redis Configuration Check API
 * Simple endpoint to verify Redis environment variables
 */

import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    // Environment variables
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET',

    // Derived values
    hasRedisUrl: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
    hasRedisToken: !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN),

    // URL for display (truncated)
    urlPreview: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || 'NONE').substring(0, 50),
  };

  const isConfigured = config.hasRedisUrl && config.hasRedisToken;

  return NextResponse.json({
    configured: isConfigured,
    config,
    message: isConfigured
      ? "Redis is configured"
      : "Redis is NOT configured - please set KV_REST_API_URL and KV_REST_API_TOKEN",
  });
}
