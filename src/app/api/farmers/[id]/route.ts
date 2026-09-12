import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/farmers/[id] — Public Farmer Cooperative Storefront & Reputation Data
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  try {
    const { id } = await params;
    if (!id) {
      const res = NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Farmer Profile ID is required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            createdAt: true,
            isActive: true,
          },
        },
        products: {
          where: {
            status: "APPROVED",
            isAvailable: true,
          },
          include: {
            category: true,
            images: true,
            inventory: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!farmerProfile) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Farmer storefront not found."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Fetch verified reviews for this farmer's products
    const productIds = farmerProfile.products.map((p) => p.id);
    const reviews = productIds.length > 0
      ? await prisma.review.findMany({
          where: { productId: { in: productIds } },
          include: {
            product: { select: { id: true, name: true } },
            buyer: { include: { user: { select: { fullName: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [];

    let totalScore = 0;
    const RATING_NUM: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    for (const r of reviews) {
      const val = typeof r.rating === "number" ? r.rating : (RATING_NUM[String(r.rating)] || 5);
      totalScore += val;
    }
    const averageRating = reviews.length > 0 ? Number((totalScore / reviews.length).toFixed(1)) : 5.0;

    const storefrontData = {
      farmer: {
        id: farmerProfile.id,
        farmName: farmerProfile.farmName,
        farmDescription: farmerProfile.farmDescription || "Verified agro-cooperative delivering certified export-grade agricultural commodities.",
        farmAddress: farmerProfile.farmAddress,
        state: farmerProfile.state,
        lga: farmerProfile.lga,
        verificationStatus: farmerProfile.verificationStatus,
        memberSince: farmerProfile.user.createdAt.toISOString(),
        fullName: farmerProfile.user.fullName,
      },
      stats: {
        activeListingsCount: farmerProfile.products.length,
        totalReviewsCount: reviews.length,
        averageRating,
      },
      products: farmerProfile.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        unit: p.unit,
        category: p.category.name,
        availableQty: p.inventory?.availableQty ?? 0,
        primaryImage: p.images?.[0]?.imageUrl || "/images/products/sesame_seeds.png",
        images: p.images.map((img) => img.imageUrl),
        createdAt: p.createdAt.toISOString(),
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: typeof r.rating === "number" ? r.rating : 5,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        productName: r.product.name,
        buyerName: r.buyer?.user?.fullName || "Verified Buyer",
      })),
    };

    const res = NextResponse.json(createSuccessResponse(storefrontData), { status: 200 });
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error in GET /api/farmers/[id]:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to load farmer storefront."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
