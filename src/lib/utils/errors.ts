/**
 * Error handling utilities
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class UploadError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("UPLOAD_ERROR", message, details);
    this.name = "UploadError";
  }
}

export class ParseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("PARSE_ERROR", message, details);
    this.name = "ParseError";
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("AI_SERVICE_ERROR", message, details);
    this.name = "AIServiceError";
  }
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
