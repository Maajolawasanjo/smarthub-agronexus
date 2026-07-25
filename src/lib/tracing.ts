import { NextResponse } from "next/server";

export interface TraceContext {
  traceId: string;
  spanId: string;
  correlationId: string;
  startTime: number;
}

export function createTraceContext(req?: Request): TraceContext {
  const existingTrace = req?.headers.get("x-trace-id");
  const existingCorrelation = req?.headers.get("x-correlation-id");

  const traceId = existingTrace || `tr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const spanId = `sp-${Math.random().toString(36).substring(2, 9)}`;
  const correlationId = existingCorrelation || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    traceId,
    spanId,
    correlationId,
    startTime: Date.now(),
  };
}

export function attachTraceHeaders(response: NextResponse, context: TraceContext): NextResponse {
  const durationMs = Date.now() - context.startTime;
  response.headers.set("x-trace-id", context.traceId);
  response.headers.set("x-span-id", context.spanId);
  response.headers.set("x-correlation-id", context.correlationId);
  response.headers.set("x-response-time-ms", durationMs.toString());
  return response;
}
