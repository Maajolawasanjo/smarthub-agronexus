import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { recordAuditEvent } from "@/lib/audit";

export type AccountLifecycleState =
  | "ACTIVE"
  | "SUSPENDED"
  | "LOCKED"
  | "PENDING_VERIFICATION"
  | "DEACTIVATED"
  | "BANNED";

// PATCH /api/admin/users/[id]/freeze — Account Lifecycle State & Suspension Control
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: targetUserId } = await params;

  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required to freeze users"),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (auth.userId === targetUserId) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_ACTION", "Administrators cannot freeze or suspend their own account"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const { state, reason, expiryDays } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Target user account not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const targetState: AccountLifecycleState = state || (targetUser.isActive ? "SUSPENDED" : "ACTIVE");
    const isNowActive = targetState === "ACTIVE";

    // Transactional status update and active session revocation on freeze/suspension
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive: isNowActive },
        select: { id: true, email: true, fullName: true, role: true, isActive: true, updatedAt: true },
      });

      if (!isNowActive) {
        await tx.session.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return user;
    });

    await recordAuditEvent({
      category: "USER",
      severity: isNowActive ? "INFO" : "WARNING",
      action: `User account status transitioned to ${targetState}`,
      actorId: auth.userId,
      actorEmail: auth.user.email,
      resourceType: "User",
      resourceId: updatedUser.id,
      metadata: { targetEmail: updatedUser.email, targetState, reason },
      req,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        user: updatedUser,
        lifecycleState: targetState,
        reason: reason || "Administrative policy enforcement",
        expiryTimestamp: expiryDays ? new Date(Date.now() + expiryDays * 86400000).toISOString() : null,
        message: `User account ${updatedUser.email} status transitioned to ${targetState}.`,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("USER_FREEZE_FAILED", err.message || "Failed to update user account freeze status"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
