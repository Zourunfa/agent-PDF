/**
 * Error handling utilities for MVC architecture
 */

/**
 * 基础应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * 参数验证错误 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

/**
 * 未认证错误 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

/**
 * 无权限错误 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * 资源不存在错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * 资源冲突错误 (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

/**
 * 配额超限错误 (429)
 */
export class QuotaExceededError extends AppError {
  constructor(
    message: string = "Quota exceeded",
    details?: { quotaType?: string; limit?: number; current?: number }
  ) {
    super("QUOTA_EXCEEDED", message, 429, details);
    this.name = "QuotaExceededError";
  }
}

/**
 * 上传错误 (400)
 */
export class UploadError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("UPLOAD_ERROR", message, 400, details);
    this.name = "UploadError";
  }
}

/**
 * 解析错误 (422)
 */
export class ParseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("PARSE_ERROR", message, 422, details);
    this.name = "ParseError";
  }
}

/**
 * AI 服务错误 (502)
 */
export class AIServiceError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("AI_SERVICE_ERROR", message, 502, details);
    this.name = "AIServiceError";
  }
}

/**
 * 内部服务器错误 (500)
 */
export class InternalError extends AppError {
  constructor(message: string = "Internal server error") {
    super("INTERNAL_ERROR", message, 500);
    this.name = "InternalError";
  }
}

/**
 * 数据库错误 (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database error") {
    super("DATABASE_ERROR", message, 500);
    this.name = "DatabaseError";
  }
}

/**
 * 外部服务错误 (502)
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, serviceName?: string) {
    super(
      "EXTERNAL_SERVICE_ERROR",
      message,
      502,
      serviceName ? { serviceName } : undefined
    );
    this.name = "ExternalServiceError";
  }
}

/**
 * 判断是否为应用错误
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 从未知错误创建 AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message);
  }

  return new InternalError("Unknown error occurred");
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "发生未知错误",
    },
    timestamp: new Date().toISOString(),
  };
}
