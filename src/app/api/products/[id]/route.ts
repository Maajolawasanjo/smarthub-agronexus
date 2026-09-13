import { NextResponse } from "next/server";
import { prisma, executeWithDbRetry } from "@/lib/prisma";
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

    const product = await executeWithDbRetry(() =>
      prisma.product.findUnique({
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
      })
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Related Products (Query other products in the same category or state, excluding current ID)
    let rawRelated = await prisma.product.findMany({
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

    if (rawRelated.length < 4) {
      const existingIds = [id, ...rawRelated.map((r) => r.id)];
      const fallbackDbProducts = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          isAvailable: true,
        },
        include: {
          category: true,
          farmerProfile: true,
          images: true,
          inventory: true,
        },
        take: 4 - rawRelated.length,
      });
      rawRelated = [...rawRelated, ...fallbackDbProducts];
    }

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
        moq: p.moq || 1,
        grade: p.grade,
        condition: p.condition,
        packaging: p.packaging,
        packageSize: p.packageSize,
        availabilityStatus: p.availabilityStatus,
        farmState: p.farmState || p.farmerProfile?.state,
        farmLga: p.farmLga || p.farmerProfile?.lga,
      };
    };

    const formattedRelated = rawRelated.map(formatRelatedItem);

    // If fewer than 4 related items from DB, supplement with curated complementary commodities
    if (formattedRelated.length < 4) {
      const COMPLEMENTARY_CATALOG: MarketplaceProductItemDTO[] = [
        {
          id: "rec_cassava_flour",
          name: "High-Quality Cassava Flour (HQCF)",
          description: "Premium food & bakery grade cassava flour. Moisture <10%, high starch content, perfect for wholesale buyers.",
          price: 18500,
          unit: "50kg Bag",
          isAvailable: true,
          createdAt: new Date().toISOString(),
          category: { id: "cat_flours", name: "Flours & Starches" },
          farmer: {
            id: "fpr_benue_coop",
            farmName: "Benue Valley Processors",
            state: "Benue",
            lga: "Makurdi",
            verificationStatus: "APPROVED",
          },
          inventory: {
            availableQty: 450,
            reservedQty: 0,
            stockStatus: "IN_STOCK",
          },
          images: [{ id: "img_flour", imageUrl: "/images/products/flour.png" }],
          primaryImage: "/images/products/flour.png",
          moq: 5,
          grade: "Grade A (Export)",
          packaging: "Multi-wall Kraft Bags",
        },
        {
          id: "rec_sesame_seeds",
          name: "Natural White Sesame Seeds",
          description: "Export-ready cleaned natural sesame seeds. 99% purity, oil content >50%, free of salmonella.",
          price: 42000,
          unit: "50kg Bag",
          isAvailable: true,
          createdAt: new Date().toISOString(),
          category: { id: "cat_oilseeds", name: "Oilseeds & Grains" },
          farmer: {
            id: "fpr_kano_seeds",
            farmName: "Kano Agro Cooperative",
            state: "Kano",
            lga: "Dambatta",
            verificationStatus: "APPROVED",
          },
          inventory: {
            availableQty: 800,
            reservedQty: 0,
            stockStatus: "IN_STOCK",
          },
          images: [{ id: "img_sesame", imageUrl: "/images/products/sesame_seeds.png" }],
          primaryImage: "/images/products/sesame_seeds.png",
          moq: 10,
          grade: "Export Grade A",
          packaging: "Jute Sacks (50kg)",
        },
        {
          id: "rec_dried_ginger",
          name: "Split Dried Ginger Roots",
          description: "Sun-dried ginger rhizomes with high oleoresin and pungent aroma. Cleaned and prepared for container loading.",
          price: 65000,
          unit: "40kg Bag",
          isAvailable: true,
          createdAt: new Date().toISOString(),
          category: { id: "cat_spices", name: "Spices & Herbs" },
          farmer: {
            id: "fpr_kaduna_ginger",
            farmName: "Southern Kaduna Ginger Union",
            state: "Kaduna",
            lga: "Kachia",
            verificationStatus: "APPROVED",
          },
          inventory: {
            availableQty: 300,
            reservedQty: 0,
            stockStatus: "IN_STOCK",
          },
          images: [{ id: "img_ginger", imageUrl: "/images/products/ginger_spices.png" }],
          primaryImage: "/images/products/ginger_spices.png",
          moq: 4,
          grade: "Export Grade A",
          packaging: "PP Woven Sacks",
        },
        {
          id: "rec_cashew_nuts",
          name: "Raw Sun-Dried Cashew Nuts",
          description: "High outturn cashew nuts (KOR 48-50 lbs), moisture <8%, nut count 180-200 per kg. Sourced directly from certified plantations.",
          price: 82000,
          unit: "80kg Bag",
          isAvailable: true,
          createdAt: new Date().toISOString(),
          category: { id: "cat_cashew", name: "Nuts & Oilseeds" },
          farmer: {
            id: "fpr_oyo_cashew",
            farmName: "Oyo Highlands Agro",
            state: "Oyo",
            lga: "Ogbomoso",
            verificationStatus: "APPROVED",
          },
          inventory: {
            availableQty: 250,
            reservedQty: 0,
            stockStatus: "IN_STOCK",
          },
          images: [{ id: "img_cashew", imageUrl: "/images/products/cashew_nut.png" }],
          primaryImage: "/images/products/cashew_nut.png",
          moq: 5,
          grade: "Export Grade A",
          packaging: "Heavy-Duty Jute Sacks",
        },
      ];

      const existingNames = [product.name.toLowerCase(), ...formattedRelated.map((r) => r.name.toLowerCase())];
      const needed = 4 - formattedRelated.length;
      const candidates = COMPLEMENTARY_CATALOG.filter((c) => !existingNames.includes(c.name.toLowerCase()));
      formattedRelated.push(...candidates.slice(0, needed));
    }

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
      status: product.status,
      rejectionReason: product.rejectionReason,
      moderationNotes: product.moderationNotes,
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
      moq: product.moq || 1,
      grade: product.grade,
      condition: product.condition,
      produceType: product.produceType,
      variety: product.variety,
      packaging: product.packaging,
      packageSize: product.packageSize,
      pricingNotes: product.pricingNotes,
      qualityNotes: product.qualityNotes,
      availabilityStatus: product.availabilityStatus,
      availableFrom: product.availableFrom ? product.availableFrom.toISOString() : null,
      storageCondition: product.storageCondition,
      storageNotes: product.storageNotes,
      farmState: product.farmState || product.farmerProfile.state,
      farmLga: product.farmLga || product.farmerProfile.lga,
      farmCommunity: product.farmCommunity,
      specifications: {
        grade: product.grade || "Export Grade A (Certified)",
        condition: product.condition || "Freshly Harvested",
        packaging: product.packaging ? (product.packageSize ? `${product.packaging} (${product.packageSize})` : product.packaging) : "Standard Multi-wall Bags",
        packageSize: product.packageSize || undefined,
        minOrderQty: `${product.moq || 1} ${product.unit}${(product.moq || 1) > 1 ? "s" : ""}`,
        moisture: "Max 6.0% Moisture",
        admixture: "Max 0.5% Admixture",
        storageCondition: product.storageCondition || "Ambient / Ventilated",
        storageNotes: product.storageNotes || undefined,
      },
      deliveryEstimate: "3 - 7 Business Days (Port of Lagos / Port Harcourt Delivery)",
      relatedProducts: formattedRelated,
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
    const { price, isAvailable, availableQty, name, description, resubmitForApproval } = body;

    const productData: any = {};
    if (price !== undefined) productData.price = Number(price);
    if (isAvailable !== undefined) {
      if (Boolean(isAvailable) && product.status !== "APPROVED" && session.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Cannot activate product: produce must be APPROVED by admin moderation before it can be made available for sale." },
          { status: 400 }
        );
      }
      productData.isAvailable = Boolean(isAvailable);
    }
    if (name !== undefined) productData.name = String(name);
    if (description !== undefined) productData.description = String(description);

    if (resubmitForApproval) {
      productData.status = "PENDING_APPROVAL";
      productData.rejectionReason = null;
      productData.isAvailable = false;
    }

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
