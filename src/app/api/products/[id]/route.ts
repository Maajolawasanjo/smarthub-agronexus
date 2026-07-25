import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductDTO, MarketplaceProductItemDTO } from "@/dto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        farmerProfile: {
          include: {
            products: {
              select: { id: true },
            },
          },
        },
        images: true,
        inventory: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Related Products (Query other products in the same category or state, excluding current ID)
    const rawRelated = await prisma.product.findMany({
      where: {
        id: { not: id },
        isAvailable: true,
        OR: [
          { categoryId: product.categoryId },
          { farmerProfile: { state: product.farmerProfile.state } },
        ],
      },
      include: {
        category: true,
        farmerProfile: true,
        images: true,
        inventory: true,
      },
      take: 4,
    });

    const formatRelatedItem = (p: typeof rawRelated[0]): MarketplaceProductItemDTO => {
      const availableQty = p.inventory?.availableQty ?? 0;
      const reservedQty = p.inventory?.reservedQty ?? 0;
      let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
      if (availableQty <= 0) stockStatus = "OUT_OF_STOCK";
      else if (availableQty <= 20) stockStatus = "LOW_STOCK";

      return {
        id: p.id,
        name: p.name,
        description: p.description || `${p.name} export crop.`,
        price: Number(p.price),
        unit: p.unit,
        isAvailable: p.isAvailable,
        harvestDate: p.harvestDate ? p.harvestDate.toISOString() : undefined,
        createdAt: p.createdAt.toISOString(),
        category: {
          id: p.category.id,
          name: p.category.name,
        },
        farmer: {
          id: p.farmerProfile.id,
          farmName: p.farmerProfile.farmName,
          state: p.farmerProfile.state,
          lga: p.farmerProfile.lga,
          verificationStatus: p.farmerProfile.verificationStatus as any,
        },
        inventory: {
          availableQty,
          reservedQty,
          stockStatus,
        },
        images: p.images.map((img) => ({ id: img.id, imageUrl: img.imageUrl })),
        primaryImage: p.images?.[0]?.imageUrl || "/images/products/sesame_seeds.png",
      };
    };

    const availableQty = product.inventory?.availableQty ?? 0;
    const reservedQty = product.inventory?.reservedQty ?? 0;
    let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
    if (availableQty <= 0) stockStatus = "OUT_OF_STOCK";
    else if (availableQty <= 20) stockStatus = "LOW_STOCK";

    const dto: ProductDTO = {
      id: product.id,
      name: product.name,
      description: product.description || `${product.name} sourced directly from verified Nigerian farming cooperatives. Cleaned, graded, and prepared for container loading.`,
      price: Number(product.price),
      unit: product.unit,
      isAvailable: product.isAvailable,
      harvestDate: product.harvestDate ? product.harvestDate.toISOString() : undefined,
      createdAt: product.createdAt.toISOString(),
      category: {
        id: product.category.id,
        name: product.category.name,
        description: product.category.description || undefined,
      },
      farmer: {
        id: product.farmerProfile.id,
        farmName: product.farmerProfile.farmName,
        farmDescription: product.farmerProfile.farmDescription || undefined,
        farmAddress: product.farmerProfile.farmAddress,
        state: product.farmerProfile.state,
        lga: product.farmerProfile.lga,
        verificationStatus: product.farmerProfile.verificationStatus as any,
        productsCount: product.farmerProfile.products.length,
      },
      inventory: {
        availableQty,
        reservedQty,
        stockStatus,
      },
      images: product.images.map((img) => ({ id: img.id, imageUrl: img.imageUrl })),
      primaryImage: product.images?.[0]?.imageUrl || "/images/products/sesame_seeds.png",
      specifications: {
        grade: "Export Grade A (Certified)",
        moisture: "Max 6.0% Moisture",
        admixture: "Max 0.5% Admixture",
        packaging: `Standard 50kg Multi-wall Export Bags`,
        minOrderQty: `1 ${product.unit}`,
      },
      deliveryEstimate: "3 - 7 Business Days (Port of Lagos / Port Harcourt Delivery)",
      relatedProducts: rawRelated.map(formatRelatedItem),
    };

    return NextResponse.json(dto, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching ProductDTO:", error);
    return NextResponse.json({ error: "Internal server error fetching ProductDTO." }, { status: 500 });
  }
}

// PATCH /api/products/[id] — Update product details, price, inventory or availability
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { farmerProfile: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product listing not found." }, { status: 404 });
    }

    const isAuthorized = session.role === "ADMIN" || product.farmerProfile.userId === session.userId;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden. You do not own this listing." }, { status: 403 });
    }

    const body = await req.json();
    const { price, isAvailable, availableQty, name, description } = body;

    const productData: any = {};
    if (price !== undefined) productData.price = Number(price);
    if (isAvailable !== undefined) productData.isAvailable = Boolean(isAvailable);
    if (name !== undefined) productData.name = String(name);
    if (description !== undefined) productData.description = String(description);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: productData,
    });

    if (availableQty !== undefined) {
      await prisma.inventory.upsert({
        where: { productId: id },
        update: { availableQty: Number(availableQty) },
        create: { productId: id, availableQty: Number(availableQty), reservedQty: 0 },
      });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message || "Failed to update product." }, { status: 500 });
  }
}

// DELETE /api/products/[id] — Delete produce listing from database
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { farmerProfile: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product listing not found." }, { status: 404 });
    }

    const isAuthorized = session.role === "ADMIN" || product.farmerProfile.userId === session.userId;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden. You do not own this listing." }, { status: 403 });
    }

    // Delete associated images, inventory, order items (if unfulfilled), and product record in transaction
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.inventory.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: "Produce listing deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting product listing:", error);
    return NextResponse.json({ error: error.message || "Failed to delete produce listing." }, { status: 500 });
  }
}
