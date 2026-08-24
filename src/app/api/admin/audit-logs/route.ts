import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/admin/audit-logs — Audit trail with filters, date ranges, actor & traceId
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "audit:view")) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Access denied: audit:view permission required"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const categoryFilter = searchParams.get("category");
    const actorFilter = searchParams.get("actor")?.toLowerCase();

    const categoryEnum = categoryFilter ? (categoryFilter.toUpperCase() as any) : undefined;

    const dbAuditEvents = await prisma.auditEvent.findMany({
      where: categoryEnum ? { category: categoryEnum } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    let auditEvents = dbAuditEvents.map((e) => ({
      id: `AUD-${e.id.slice(0, 8)}`,
      category: e.category,
      severity: e.severity,
      action: e.action,
      actor: e.actorEmail || e.actorId || "System",
      actorEmail: e.actorEmail || "—",
      resourceId: e.resourceId || "N/A",
      traceId: traceCtx.traceId,
      timestamp: e.createdAt.toISOString(),
    }));

    // If no persistent AuditEvent records found yet, query historical table activities
    if (auditEvents.length === 0) {
      const [verifications, disputes, recentOrders] = await Promise.all([
        prisma.verification.findMany({
          take: 30,
          orderBy: { updatedAt: "desc" },
          include: { farmerProfile: { include: { user: true } } },
        }),
        prisma.dispute.findMany({
          take: 30,
          orderBy: { createdAt: "desc" },
          include: { user: true },
        }),
        prisma.order.findMany({
          take: 30,
          orderBy: { createdAt: "desc" },
          include: { buyer: { include: { user: true } } },
        }),
      ]);

      auditEvents = [
        ...verifications.map((v) => ({
          id: `AUD-KYC-${v.id.slice(0, 8)}`,
          category: "KYC" as any,
          severity: "INFO" as any,
          action: `Farmer Verification Status: ${v.farmerProfile.verificationStatus}`,
          actor: v.farmerProfile.user.fullName,
          actorEmail: v.farmerProfile.user.email,
          resourceId: v.id,
          traceId: traceCtx.traceId,
          timestamp: v.updatedAt.toISOString(),
        })),
        ...disputes.map((d) => ({
          id: `AUD-DISP-${d.id.slice(0, 8)}`,
          category: "DISPUTE" as any,
          severity: "WARNING" as any,
          action: `Dispute ${d.status}: ${d.title}`,
          actor: d.user.fullName,
          actorEmail: d.user.email,
          resourceId: d.id,
          traceId: traceCtx.traceId,
          timestamp: d.createdAt.toISOString(),
        })),
        ...recentOrders.map((o) => ({
          id: `AUD-ORD-${o.id.slice(0, 8)}`,
          category: "ORDER" as any,
          severity: "INFO" as any,
          action: `Order #${o.orderNumber} placed with status ${o.status}`,
          actor: o.buyer.user.fullName,
          actorEmail: o.buyer.user.email,
          resourceId: o.id,
          traceId: traceCtx.traceId,
          timestamp: o.createdAt.toISOString(),
        })),
      ];
    }

    if (actorFilter) {
      auditEvents = auditEvents.filter(
        (e) => e.actor.toLowerCase().includes(actorFilter) || e.actorEmail.toLowerCase().includes(actorFilter)
      );
    }

    auditEvents = auditEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const res = NextResponse.json(
      createSuccessResponse({
        totalCount: auditEvents.length,
        filters: { category: categoryFilter || "ALL", actor: actorFilter || "ALL" },
        logs: auditEvents,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("AUDIT_LOGS_FETCH_FAILED", err.message || "Failed to fetch audit logs"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
