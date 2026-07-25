import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, "agrosalt", 1000, 64, "sha512").toString("hex");
}

// POST /api/user/password — Change user password securely
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value || "usr_demo_buyer";
    const body = await req.json();

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "New password must be at least 8 characters long"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "User not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const currentHash = hashPassword(currentPassword);
    const isMatch = user.password === currentHash || user.password === currentPassword;

    if (!isMatch) {
      const res = NextResponse.json(createErrorResponse("INVALID_CREDENTIALS", "Current password is incorrect"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const newHashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    const res = NextResponse.json(createSuccessResponse({ message: "Password updated successfully" }));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("UPDATE_FAILED", err.message || "Failed to update password"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}
