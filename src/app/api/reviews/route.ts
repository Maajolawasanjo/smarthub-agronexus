import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

const RATING_MAP: Record<number, "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE"> = {
  1: "ONE",
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
};

// POST /api/reviews — Submit verified purchaser product review
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();
    const { productId, ratingScore, comment } = body;

    const numRating = Number(ratingScore);
    if (!productId || isNaN(numRating) || numRating < 1 || numRating > 5) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "productId and valid ratingScore (1-5) are required"),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!buyerProfile) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Buyer profile required to submit review"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farmerProfile: true },
    });

    if (!product) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Product not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    // Business Rule: Farmer cannot review their own product
    if (product.farmerProfile.userId === session.userId) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Farmers cannot leave reviews on their own produce listings"),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Business Rule: Verified purchaser check (Order must contain product and be DELIVERED/COMPLETED)
    const verifiedOrder = await prisma.order.findFirst({
      where: {
        buyerId: buyerProfile.id,
        orderItems: { some: { productId } },
        status: { in: ["DELIVERED", "COMPLETED"] },
      },
    });

    if (!verifiedOrder) {
      const res = NextResponse.json(
        createErrorResponse(
          "PURCHASE_REQUIRED",
          "Only buyers with a delivered or completed order can review this produce item"
        ),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Business Rule: Unique review per buyer per product
    const existingReview = await prisma.review.findUnique({
      where: { buyerId_productId: { buyerId: buyerProfile.id, productId } },
    });

    if (existingReview) {
      const res = NextResponse.json(
        createErrorResponse("DUPLICATE_REVIEW", "You have already reviewed this produce item"),
        { status: 409 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const ratingEnum = RATING_MAP[numRating];

    const review = await prisma.review.create({
      data: {
        buyerId: buyerProfile.id,
        productId,
        rating: ratingEnum,
        comment: comment?.trim() || null,
      },
    });

    const res = NextResponse.json(
      createSuccessResponse({
        review,
        message: "Thank you! Your product review has been published.",
      }),
      { status: 201 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("REVIEW_SUBMISSION_FAILED", err.message || "Failed to submit review"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
