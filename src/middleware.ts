/**
 * Rate limiting middleware
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const LIMIT = 30; // requests per minute
const WINDOW = 60 * 1000; // 1 minute in milliseconds

function getIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  return request.ip || "unknown";
}

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const identifier = getIdentifier(request);
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  }

  // Get or create rate limit entry
  let entry = rateLimit.get(identifier);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + WINDOW };
    rateLimit.set(identifier, entry);
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > LIMIT) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "请求过于频繁，请稍后再试",
          details: {
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 429 }
    );
  }

  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", LIMIT.toString());
  response.headers.set("X-RateLimit-Remaining", Math.max(0, LIMIT - entry.count).toString());
  response.headers.set("X-RateLimit-Reset", new Date(entry.resetTime).toISOString());

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
