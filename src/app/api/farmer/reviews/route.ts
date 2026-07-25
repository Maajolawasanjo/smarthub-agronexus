import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/farmer/reviews — Fetch reviews for products belonging to the logged-in farmer
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to access reviews."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: session.userId },
      include: { products: { select: { id: true } } },
    });

    if (!farmerProfile) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Account does not have a farmer profile."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProductIds = farmerProfile.products.map((p) => p.id);

    if (farmerProductIds.length === 0) {
      const res = NextResponse.json(
        createSuccessResponse({
          averageRating: 5.0,
          totalReviewsCount: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: [],
        })
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const reviews = await prisma.review.findMany({
      where: { productId: { in: farmerProductIds } },
      include: {
        product: { select: { id: true, name: true, images: true } },
        buyer: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;
    const RATING_NUM: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    for (const r of reviews) {
      const val = typeof r.rating === "number" ? r.rating : (RATING_NUM[String(r.rating)] || 5);
      const score = Math.min(5, Math.max(1, val));
      (ratingBreakdown as any)[score] = ((ratingBreakdown as any)[score] || 0) + 1;
      sumRating += val;
    }

    const averageRating = reviews.length > 0 ? Number((sumRating / reviews.length).toFixed(1)) : 5.0;

    const mappedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: new Date(r.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      product: {
        id: r.product.id,
        name: r.product.name,
      },
      buyer: {
        fullName: r.buyer?.user?.fullName || "Verified Buyer",
      },
      isVerifiedPurchase: true,
    }));

    const res = NextResponse.json(
      createSuccessResponse({
        averageRating,
        totalReviewsCount: reviews.length,
        ratingBreakdown,
        reviews: mappedReviews,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in GET /api/farmer/reviews:", err);
    const res = NextResponse.json(
      createErrorResponse("REVIEWS_FETCH_FAILED", err.message || "Failed to fetch farmer reviews."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
