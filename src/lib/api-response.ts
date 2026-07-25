import { NextResponse } from "next/server";
import { AppError } from "./errors";

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  data: T | null;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any[];
  } | null;
}

export function successResponse<T>(data: T, meta?: Record<string, any>, status: number = 200) {
  const envelope: ApiResponseEnvelope<T> = {
    success: true,
    data,
    meta,
    error: null,
  };
  return NextResponse.json(envelope, { status });
}

export function errorResponse(error: any) {
  if (error instanceof AppError) {
    const envelope: ApiResponseEnvelope = {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    return NextResponse.json(envelope, { status: error.statusCode });
  }

  const envelope: ApiResponseEnvelope = {
    success: false,
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error?.message || "An unexpected server error occurred.",
    },
  };
  return NextResponse.json(envelope, { status: 500 });
}

export function createSuccessResponse<T>(data: T, meta?: Record<string, any>): ApiResponseEnvelope<T> {
  return {
    success: true,
    data,
    meta,
    error: null,
  };
}

export function createErrorResponse(code: string, message: string, details?: any[]): ApiResponseEnvelope {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
}
