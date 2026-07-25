import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/coupons/validate — Validate promotional coupon code
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const body = await req.json();
    const { code, orderTotal } = body;

    if (!code || typeof code !== "string") {
      const res = NextResponse.json(createErrorResponse("INVALID_INPUT", "Coupon code is required"), { status: 400 });
      return attachTraceHeaders(res, traceCtx);
    }

    const totalNum = parseFloat(orderTotal) || 0;

    // Fetch coupon from database or fallback to default demo coupons
    let coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon && code.trim().toUpperCase() === "AGRO10") {
      // Seed default demo coupon
      coupon = await prisma.coupon.create({
        data: {
          code: "AGRO10",
          discountPct: 10.0,
          minSpend: 5000.0,
          isActive: true,
        },
      });
    }

    if (!coupon || !coupon.isActive) {
      const res = NextResponse.json(createErrorResponse("COUPON_INVALID", "Invalid or inactive coupon code"), { status: 400 });
      return attachTraceHeaders(res, traceCtx);
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      const res = NextResponse.json(createErrorResponse("COUPON_EXPIRED", "This coupon code has expired"), { status: 400 });
      return attachTraceHeaders(res, traceCtx);
    }

    const minSpend = Number(coupon.minSpend);
    if (totalNum < minSpend) {
      const res = NextResponse.json(
        createErrorResponse(
          "MIN_SPEND_NOT_MET",
          `Order total of ₦${totalNum.toLocaleString()} does not meet minimum spend of ₦${minSpend.toLocaleString()}`
        ),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const discountPct = Number(coupon.discountPct);
    const discountAmount = Math.min(totalNum, (totalNum * discountPct) / 100);
    const finalTotal = Math.max(0, totalNum - discountAmount);

    const res = NextResponse.json(
      createSuccessResponse({
        code: coupon.code,
        discountPct,
        discountAmount,
        originalTotal: totalNum,
        finalTotal,
        isValid: true,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("VALIDATION_FAILED", err.message || "Failed to validate coupon"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}
