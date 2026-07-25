import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

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
    const session = await getSession();
    if (!session || !hasPermission(session.role, "users:freeze")) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Permission users:freeze required"),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    if (session.userId === targetUserId) {
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

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: isNowActive },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, updatedAt: true },
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
