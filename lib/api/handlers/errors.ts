import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { log } from "@/lib/logger";

// Custom API Error class
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Specific error types
export class ValidationError extends APIError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(400, message, errors);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends APIError {
  constructor(message = "Nije autentificiran") {
    super(401, message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends APIError {
  constructor(message = "Nema pristupa resursima") {
    super(403, message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends APIError {
  constructor(resource = "Resurs") {
    super(404, `${resource} nije pronađen`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(409, message);
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
    log.error("Unexpected error", { message: error.message, stack: error.stack });
    apiError = new APIError(500, "Interna greška servera");
  } else {
    log.error("Unknown error", { error });
    apiError = new APIError(500, "Nepoznata greška");
  }

  return {
    statusCode: apiError.statusCode,
    message: apiError.message,
    errors: apiError.errors,
  };
}

// Handle API errors globally
export function handleAPIError(error: unknown) {
  const formatted = formatErrorResponse(error);
  
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
        ...(formatted.errors && { errors: formatted.errors }),
      },
    },
    { status: formatted.statusCode }
  );
}
