import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/wallet/bank-accounts — List user's linked bank accounts
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to view bank accounts."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const res = NextResponse.json(createSuccessResponse(accounts));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("FETCH_FAILED", err.message || "Failed to list bank accounts"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}

// POST /api/wallet/bank-accounts — Add a new linked bank account
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to add a bank account."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();
    const { bankName, bankCode, accountNumber, accountName } = body;

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      const res = NextResponse.json(createErrorResponse("INVALID_INPUT", "Missing required bank details"), { status: 400 });
      return attachTraceHeaders(res, traceCtx);
    }

    const existingCount = await prisma.bankAccount.count({ where: { userId: session.userId } });
    const isDefault = existingCount === 0;

    const newAccount = await prisma.bankAccount.create({
      data: {
        userId: session.userId,
        bankName,
        bankCode,
        accountNumber,
        accountName,
        isVerified: true,
        isDefault,
      },
    });

    const res = NextResponse.json(createSuccessResponse(newAccount), { status: 201 });
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("CREATE_FAILED", err.message || "Failed to add bank account"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/wallet/bank-accounts — Set a bank account as primary default
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { bankAccountId } = await req.json();
    if (!bankAccountId) {
      const res = NextResponse.json(createErrorResponse("INVALID_INPUT", "bankAccountId is required"), { status: 400 });
      return attachTraceHeaders(res, traceCtx);
    }

    await prisma.$transaction([
      prisma.bankAccount.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      }),
      prisma.bankAccount.update({
        where: { id: bankAccountId, userId: session.userId },
        data: { isDefault: true },
      }),
    ]);

    const updatedList = await prisma.bankAccount.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const res = NextResponse.json(createSuccessResponse(updatedList));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("UPDATE_FAILED", err.message || "Failed to set default bank account"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}

// DELETE /api/wallet/bank-accounts — Delete a linked bank account
export async function DELETE(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { searchParams } = new URL(req.url);
    const bankAccountId = searchParams.get("id");

    if (!bankAccountId) {
      const res = NextResponse.json(createErrorResponse("INVALID_INPUT", "bankAccountId query param 'id' is required"), { status: 400 });
      return attachTraceHeaders(res, traceCtx);
    }

    await prisma.bankAccount.deleteMany({
      where: { id: bankAccountId, userId: session.userId },
    });

    const res = NextResponse.json(createSuccessResponse({ deleted: true, id: bankAccountId }));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("DELETE_FAILED", err.message || "Failed to delete bank account"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}

