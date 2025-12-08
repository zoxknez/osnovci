import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { log } from "@/lib/logger";

// Custom API Error class
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>,
    public code?: string, // Error code for client-side handling
  ) {
    super(message);
    this.name = "APIError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

// Specific error types
export class ValidationError extends APIError {
  constructor(
    message: string,
    errors?: Record<string, string[]>,
    code = "VALIDATION_ERROR",
  ) {
    super(400, message, errors, code);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends APIError {
  constructor(message = "Nije autentificiran", code = "UNAUTHORIZED") {
    super(401, message, undefined, code);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends APIError {
  constructor(message = "Nema pristupa resursima", code = "FORBIDDEN") {
    super(403, message, undefined, code);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends APIError {
  constructor(resource = "Resurs", code = "NOT_FOUND") {
    super(404, `${resource} nije pronađen`, undefined, code);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends APIError {
  constructor(message: string, code = "CONFLICT") {
    super(409, message, undefined, code);
    this.name = "ConflictError";
  }
}

// Handle Zod validation errors
export function handleZodError(error: ZodError) {
  const errors: Record<string, string[]> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return new ValidationError("Greška pri validaciji podataka", errors);
}

// Format error response
export function formatErrorResponse(error: unknown) {
  let apiError: APIError;

  if (error instanceof ZodError) {
    apiError = handleZodError(error);
  } else if (error instanceof APIError) {
    apiError = error;
  } else if (error instanceof Error) {
    log.error("Unexpected error", {
      message: error.message,
      stack: error.stack,
    });
    apiError = new APIError(
      500,
      "Interna greška servera",
      undefined,
      "INTERNAL_ERROR",
    );
  } else {
    log.error("Unknown error", { error });
    apiError = new APIError(
      500,
      "Nepoznata greška",
      undefined,
      "UNKNOWN_ERROR",
    );
  }

  return {
    statusCode: apiError.statusCode,
    message: apiError.message,
    errors: apiError.errors,
    code: apiError.code, // Include error code for client-side handling
  };
}

// Handle API errors globally
export function handleAPIError(error: unknown) {
  const formatted = formatErrorResponse(error);

  // Capture to Sentry for monitoring (only server errors)
  if (formatted.statusCode >= 500) {
    Sentry.captureException(error, {
      tags: {
        errorType: "api_error",
        statusCode: formatted.statusCode,
      },
      extra: {
        message: formatted.message,
        errors: formatted.errors,
      },
    });
  }

  log.error("API Error", {
    statusCode: formatted.statusCode,
    message: formatted.message,
    errors: formatted.errors,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        message: formatted.message,
        code: formatted.code,
        ...(formatted.errors && { errors: formatted.errors }),
      },
    },
    { status: formatted.statusCode },
  );
}
