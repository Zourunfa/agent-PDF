import { NextResponse } from 'next/server';

/**
 * 统一 API 响应格式类型定义
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status }
  );
}

/**
 * 错误响应
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * 分页响应数据类型
 */
export interface PaginatedData<T> {
  items: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * 分页成功响应
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
  status: number = 200
): NextResponse<ApiResponse<PaginatedData<T>>> {
  return NextResponse.json(
    {
      success: true,
      data: {
        items,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        },
      },
      error: null,
    },
    { status }
  );
}
