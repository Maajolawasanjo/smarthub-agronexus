import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isTrustedMutationOrigin } from "@/lib/csrf";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/user/password — Change the authenticated account's password.
// Never use caller-supplied user IDs, direct userId cookies, or demo fallbacks.
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session?.userId) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required."), { status: 401 }),
        traceCtx
      );
    }

    if (!isTrustedMutationOrigin(req)) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("FORBIDDEN", "Untrusted mutation origin."), { status: 403 }),
        traceCtx
      );
    }

    const body = await req.json().catch(() => null);
    const currentPassword = body?.currentPassword;
    const newPassword = body?.newPassword;
    if (
      typeof currentPassword !== "string" || !currentPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72 ||
      newPassword === currentPassword
    ) {
      return attachTraceHeaders(
        NextResponse.json(
          createErrorResponse("INVALID_INPUT", "Provide your current password and a different new password of 8–72 UTF-8 bytes."),
          { status: 400 }
        ),
        traceCtx
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, password: true, isActive: true },
    });

    // Do not leak whether an account exists or its password hash format.
    if (!user?.isActive || !user.password || !(await bcrypt.compare(currentPassword, user.password))) {
      return attachTraceHeaders(
        NextResponse.json(createErrorResponse("INVALID_CREDENTIALS", "Current password is incorrect."), { status: 401 }),
        traceCtx
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // The password change and revocation of ALL existing login sessions
    // commit together. The user must sign in again with the new password.
    await prisma.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: { id: session.userId, isActive: true, password: user.password },
        data: { password: newPasswordHash },
      });
      if (changed.count !== 1) {
        throw new Error("PASSWORD_CHANGE_CONFLICT");
      }
      await tx.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return attachTraceHeaders(
      NextResponse.json(createSuccessResponse({
        message: "Password updated successfully. Sign in again with your new password.",
        requiresReauthentication: true,
      })),
      traceCtx
    );
  } catch (error) {
    console.error("[PASSWORD_CHANGE_FAILED]", error instanceof Error ? error.name : "Unknown");
    return attachTraceHeaders(
      NextResponse.json(createErrorResponse("UPDATE_FAILED", "Unable to update password. Please try again."), { status: 500 }),
      traceCtx
    );
  }
}
