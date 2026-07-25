import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "UP";

  try {
    // Ping database with lightweight query
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "DOWN";
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === "UP";

  return NextResponse.json(
    {
      status: isHealthy ? "UP" : "DEGRADED",
      version: config.app.version,
      environment: config.app.environment,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latencyMs: responseTimeMs,
        },
        eventBus: "UP",
        settlementEngine: "UP",
        fulfillmentEngine: "UP",
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
