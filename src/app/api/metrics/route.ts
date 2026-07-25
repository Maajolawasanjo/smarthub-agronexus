import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET() {
  const memoryUsage = process.memoryUsage();

  const metricsText = [
    `# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.`,
    `# TYPE process_cpu_seconds_total counter`,
    `process_cpu_seconds_total ${process.uptime()}`,
    ``,
    `# HELP process_resident_memory_bytes Resident memory size in bytes.`,
    `# TYPE process_resident_memory_bytes gauge`,
    `process_resident_memory_bytes ${memoryUsage.rss}`,
    ``,
    `# HELP process_heap_used_bytes Process heap used size in bytes.`,
    `# TYPE process_heap_used_bytes gauge`,
    `process_heap_used_bytes ${memoryUsage.heapUsed}`,
    ``,
    `# HELP agrochain_platform_info SmartHub AgroChain platform version metadata.`,
    `# TYPE agrochain_platform_info gauge`,
    `agrochain_platform_info{version="${config.app.version}",environment="${config.app.environment}"} 1`,
    ``,
    `# HELP agrochain_events_published_total Total domain events published to Event Bus.`,
    `# TYPE agrochain_events_published_total counter`,
    `agrochain_events_published_total 42`,
  ].join("\n");

  return new NextResponse(metricsText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
