import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

const NUMERIC_RATING: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

// GET /api/products/[id]/reviews — Retrieve product reviews & aggregate rating summary
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: productId } = await params;

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        buyer: {
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + (NUMERIC_RATING[r.rating] || 5), 0);
    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 5.0;

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      buyerName: r.buyer.user.fullName,
      ratingScore: NUMERIC_RATING[r.rating] || 5,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    const res = NextResponse.json(
      createSuccessResponse({
        productId,
        totalReviews,
        averageRating,
        reviews: formattedReviews,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("REVIEWS_FETCH_FAILED", err.message || "Failed to fetch reviews"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
