import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

export interface BulkUpdateItem {
  id: string;
  price?: number;
  availableQty?: number;
  isAvailable?: boolean;
}

// POST /api/farmer/produce/bulk — Execute bulk price and stock inventory updates
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required for bulk produce updates."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!farmerProfile) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Only verified farmer profiles can execute bulk inventory updates."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const { items } = (await req.json()) as { items: BulkUpdateItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      const res = NextResponse.json(
        createErrorResponse("INVALID_INPUT", "An array of update items is required."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Verify ownership of all target products
    const productIds = items.map((i) => i.id);
    const ownedProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, farmerProfileId: farmerProfile.id },
      select: { id: true },
    });

    const ownedSet = new Set(ownedProducts.map((p) => p.id));
    const unauthorizedItems = items.filter((i) => !ownedSet.has(i.id));

    if (unauthorizedItems.length > 0) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED_PRODUCT", "One or more product IDs do not belong to this farmer profile."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Execute atomic transaction for bulk updates
    const updates = items.map((item) => {
      const productData: any = {};
      if (item.price !== undefined) productData.price = item.price;
      if (item.isAvailable !== undefined) productData.isAvailable = item.isAvailable;

      const operations = [];

      if (Object.keys(productData).length > 0) {
        operations.push(
          prisma.product.update({
            where: { id: item.id },
            data: productData,
          })
        );
      }

      if (item.availableQty !== undefined) {
        operations.push(
          prisma.inventory.upsert({
            where: { productId: item.id },
            update: { availableQty: item.availableQty },
            create: { productId: item.id, availableQty: item.availableQty, reservedQty: 0 },
          })
        );
      }

      return operations;
    }).flat();

    await prisma.$transaction(updates);

    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    });

    const res = NextResponse.json(
      createSuccessResponse({
        updatedCount: productIds.length,
        products: updatedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          availableQty: p.inventory?.availableQty ?? 0,
          isAvailable: p.isAvailable,
        })),
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in POST /api/farmer/produce/bulk:", err);
    const res = NextResponse.json(
      createErrorResponse("BULK_UPDATE_FAILED", err.message || "Failed to execute bulk produce update."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
