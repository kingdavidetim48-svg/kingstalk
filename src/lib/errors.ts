/**
 * PHASE 1: Centralized Error Handling & Application Error Taxonomy
 *
 * Provides typed, structured error definitions for KingsTalk.
 * Prevents internal details, stack traces, and SQL from leaking to clients.
 */

import { TRPCError } from "@trpc/server";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | "PAYMENT_REQUIRED";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: ErrorCode = "INTERNAL_SERVER_ERROR", status = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Permission denied") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: Record<string, unknown>) {
    super(message, "BAD_REQUEST", 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, "CONFLICT", 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded. Please try again later.") {
    super(message, "RATE_LIMITED", 429);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = "Insufficient credits or active subscription required") {
    super(message, "PAYMENT_REQUIRED", 402);
  }
}

/**
 * Maps an AppError to an appropriate TRPCError
 */
export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;

  if (error instanceof AppError) {
    const codeMap: Record<ErrorCode, TRPCError["code"]> = {
      UNAUTHORIZED: "UNAUTHORIZED",
      FORBIDDEN: "FORBIDDEN",
      NOT_FOUND: "NOT_FOUND",
      BAD_REQUEST: "BAD_REQUEST",
      CONFLICT: "CONFLICT",
      RATE_LIMITED: "TOO_MANY_REQUESTS",
      INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
      PAYMENT_REQUIRED: "PAYMENT_REQUIRED" as TRPCError["code"],
    };

    return new TRPCError({
      code: codeMap[error.code] || "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error,
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    cause: error,
  });
}
