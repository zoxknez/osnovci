import { NextResponse } from "next/server";

// Standard API success response
export interface APISuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

// Generic success response builder
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    } as APISuccessResponse<T>,
    { status: statusCode }
  );
}

// Success response with pagination
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  statusCode = 200
): NextResponse {
  const pages = Math.ceil(total / limit);
  
  return NextResponse.json(
    {
      success: true,
      data: {
        data,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasMore: page < pages,
        },
      },
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// Created response (201)
export function createdResponse<T>(
  data: T,
  message = "Kreirano uspješno"
): NextResponse {
  return successResponse(data, message, 201);
}

// No content response (204)
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
