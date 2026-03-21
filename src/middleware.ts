/**
 * Middleware: Rate Limiting + Supabase Session Refresh
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const LIMIT = 30; // requests per minute
const WINDOW = 60 * 1000; // 1 minute in milliseconds

// 不需要频率限制的 API 路径
const EXCLUDED_PATHS = ['/api/user/stats', '/api/auth/me', '/api/quota/stats'];

function getIdentifier(request: NextRequest): string {
  return request.ip || 'unknown';
}

function shouldExclude(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  // 创建一个新的响应对象，Supabase 会在上面设置 cookies
  let supabaseResponse = NextResponse.next({ request });

  // 1. Supabase Session Refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 先设置到 request 上（用于当前请求）
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 再设置到 response 上（用于返回给浏览器）
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 刷新 session（如果是有效 session 会自动续期）
  await supabase.auth.getUser();

  // 2. Rate Limiting (仅 API 路由)
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (shouldExclude(request.nextUrl.pathname)) {
      return supabaseResponse;
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
      const rateLimitResponse = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
            details: {
              retryAfter: Math.ceil((entry.resetTime - now) / 1000),
            },
          },
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
      // 复制 supabase 设置的 cookies 到 rate limit response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        rateLimitResponse.cookies.set(cookie.name, cookie.value);
      });
      return rateLimitResponse;
    }

    // Add rate limit headers to supabaseResponse
    supabaseResponse.headers.set('X-RateLimit-Limit', LIMIT.toString());
    supabaseResponse.headers.set(
      'X-RateLimit-Remaining',
      Math.max(0, LIMIT - entry.count).toString()
    );
    supabaseResponse.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 匹配所有路由（包括页面和 API）
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
