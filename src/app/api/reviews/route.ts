import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { recordAuditEvent } from "@/lib/audit";

const RATING_MAP: Record<number | string, "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE"> = {
  1: "ONE",
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
  ONE: "ONE",
  TWO: "TWO",
  THREE: "THREE",
  FOUR: "FOUR",
  FIVE: "FIVE",
};

// POST /api/reviews — Submit verified buyer review on delivered produce
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to submit a review."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!buyerProfile) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Only buyers can review produce."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const { productId, orderId, rating, comment } = body;

    if (!productId || !rating) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Product ID and rating (1-5) are required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const mappedRating = RATING_MAP[rating];
    if (!mappedRating) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_RATING", "Rating must be between 1 and 5."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Verify verified purchase: check that buyer ordered this product and it was delivered
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (!order) {
        const res = NextResponse.json(
          createErrorResponse("NOT_FOUND", "Referenced order not found."),
          { status: 404 }
        );
        return attachTraceHeaders(res, traceCtx);
      }

      if (order.buyerId !== buyerProfile.id) {
        const res = NextResponse.json(
          createErrorResponse("FORBIDDEN", "You can only review produce from your own orders."),
          { status: 403 }
        );
        return attachTraceHeaders(res, traceCtx);
      }

      const hasItem = order.orderItems.some((oi) => oi.productId === productId);
      if (!hasItem) {
        const res = NextResponse.json(
          createErrorResponse("BAD_REQUEST", "Produce was not part of the specified order."),
          { status: 400 }
        );
        return attachTraceHeaders(res, traceCtx);
      }

      if (order.status !== "DELIVERED" && order.status !== "COMPLETED") {
        const res = NextResponse.json(
          createErrorResponse(
            "ORDER_NOT_DELIVERED",
            "Reviews can only be submitted after produce has been delivered."
          ),
          { status: 400 }
        );
        return attachTraceHeaders(res, traceCtx);
      }
    }

    const review = await prisma.review.upsert({
      where: {
        buyerId_productId: {
          buyerId: buyerProfile.id,
          productId,
        },
      },
      update: {
        rating: mappedRating,
        comment: comment ? comment.trim() : null,
        orderId: orderId || undefined,
      },
      create: {
        buyerId: buyerProfile.id,
        productId,
        orderId: orderId || undefined,
        rating: mappedRating,
        comment: comment ? comment.trim() : null,
      },
      include: {
        product: { select: { name: true } },
      },
    });

    await recordAuditEvent({
      category: "SYSTEM",
      severity: "INFO",
      action: "REVIEW_SUBMITTED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "REVIEW",
      resourceId: review.id,
      metadata: {
        productId,
        productName: review.product.name,
        rating: mappedRating,
        hasComment: Boolean(comment),
      },
      req,
    });

    const res = NextResponse.json(
      createSuccessResponse({
        message: "Review submitted successfully.",
        review,
      }),
      { status: 201 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error submitting review:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to submit review."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// GET /api/reviews — Retrieve reviews for a product
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "productId query parameter is required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        buyer: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const res = NextResponse.json(createSuccessResponse({ reviews }), { status: 200 });
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch reviews."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
