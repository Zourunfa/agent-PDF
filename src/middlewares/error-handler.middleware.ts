import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  AppError,
  isAppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  QuotaExceededError,
  InternalError,
} from '@/lib/utils/errors';
import { errorResponse } from '@/lib/utils/response';

/**
 * 错误处理结果
 */
export interface HandleErrorResult {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 处理错误并返回统一格式
 */
export function handleError(error: unknown): NextResponse {
  const result = parseError(error);
  return errorResponse(result.code, result.message, result.statusCode, result.details);
}

/**
 * 解析错误并返回错误信息
 */
export function parseError(error: unknown): HandleErrorResult {
  // Zod 验证错误
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  }

  // 应用错误
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // 标准 Error
  if (error instanceof Error) {
    // 检查是否为特定的错误类型（通过名称判断）
    if (error.name === 'UnauthorizedError') {
      return {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: error.message || 'Unauthorized',
      };
    }

    if (error.name === 'ForbiddenError') {
      return {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: error.message || 'Forbidden',
      };
    }

    // 默认内部错误
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
    };
  }

  // 未知错误
  console.error('Unknown error:', error);
  return {
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };
}

/**
 * 异步处理器包装函数
 * 自动捕获错误并返回统一格式
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * 创建错误日志
 */
export function logError(
  error: unknown,
  context?: {
    path?: string;
    method?: string;
    userId?: string;
    [key: string]: unknown;
  }
): void {
  const timestamp = new Date().toISOString();
  const errorInfo = parseError(error);

  console.error(JSON.stringify({
    timestamp,
    level: 'error',
    error: {
      code: errorInfo.code,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      details: errorInfo.details,
      stack: error instanceof Error ? error.stack : undefined,
    },
    context,
  }));
}
