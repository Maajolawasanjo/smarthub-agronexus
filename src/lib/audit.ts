import { prisma } from "@/lib/prisma";

export type AuditCategory =
  | "AUTH"
  | "USER"
  | "ORDER"
  | "PAYMENT"
  | "ESCROW"
  | "DELIVERY"
  | "KYC"
  | "DISPUTE"
  | "SYSTEM";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface RecordAuditParams {
  category: AuditCategory;
  severity?: AuditSeverity;
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, any> | null;
  req?: Request | null;
}

export async function recordAuditEvent(params: RecordAuditParams) {
  try {
    const ipAddress = params.req ? params.req.headers.get("x-forwarded-for") || undefined : undefined;
    const userAgent = params.req ? params.req.headers.get("user-agent") || undefined : undefined;

    return await prisma.auditEvent.create({
      data: {
        category: params.category,
        severity: params.severity || "INFO",
        action: params.action,
        actorId: params.actorId || null,
        actorEmail: params.actorEmail || null,
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        metadata: params.metadata || undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    // Soft fail audit logging so non-critical audit issues do not disrupt main transaction flow
    console.error("[AUDIT_LOG_ERROR] Failed to record audit event:", err);
    return null;
  }
}
