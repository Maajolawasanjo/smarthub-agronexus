import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MarketplaceDTO, MarketplaceProductItemDTO } from "@/dto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const state = searchParams.get("state") || "";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const sort = searchParams.get("sort") || "newest";

    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const whereClause: any = {
      isAvailable: true,
      farmerProfile: {
        user: {
          isActive: true,
        },
      },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { farmerProfile: { farmName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category && category.toLowerCase() !== "all") {
      whereClause.OR = [
        { categoryId: category },
        { category: { name: { contains: category, mode: "insensitive" } } },
      ];
    }

    if (state) {
      whereClause.farmerProfile = {
        ...whereClause.farmerProfile,
        state: { contains: state, mode: "insensitive" },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) whereClause.price.gte = minPrice;
      if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    // Determine orderBy
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sort === "oldest") {
      orderBy = { createdAt: "asc" };
    }

    // Query Total Matches & Products with server-side connection resilience retry loop
    let totalMatches = 0;
    let productsRaw: any[] = [];
    let categoriesRaw: any[] = [];

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        [totalMatches, productsRaw, categoriesRaw] = await Promise.all([
          prisma.product.count({ where: whereClause }),
          prisma.product.findMany({
            where: whereClause,
            include: {
              category: true,
              farmerProfile: true,
              images: true,
              inventory: true,
            },
            orderBy,
            skip,
            take: limit,
          }),
          prisma.category.findMany({
            include: {
              _count: {
                select: { products: true },
              },
            },
            orderBy: { name: "asc" },
          }),
        ]);
        break; // Success
      } catch (dbErr: any) {
        if (attempt === 2) throw dbErr;
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    const formatProductItem = (p: typeof productsRaw[0]): MarketplaceProductItemDTO => {
      const availableQty = p.inventory?.availableQty ?? 0;
      const reservedQty = p.inventory?.reservedQty ?? 0;
      let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";

      if (availableQty <= 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (availableQty <= 20) {
        stockStatus = "LOW_STOCK";
      }

      const primaryImage = p.images?.[0]?.imageUrl || "/images/products/sesame_seeds.png";

      return {
        id: p.id,
        name: p.name,
        description: p.description || `${p.name} sourced directly from verified Nigerian agricultural producers.`,
        price: Number(p.price),
        unit: p.unit,
        isAvailable: p.isAvailable,
        harvestDate: p.harvestDate ? p.harvestDate.toISOString() : undefined,
        createdAt: p.createdAt.toISOString(),
        category: {
          id: p.category?.id || "cat_general",
          name: p.category?.name || "General Produce",
        },
        farmer: {
          id: p.farmerProfile?.id || "fpr_default",
          farmName: p.farmerProfile?.farmName || "Verified Agro Partner",
          state: p.farmerProfile?.state || "Nigeria",
          lga: p.farmerProfile?.lga || "",
          verificationStatus: (p.farmerProfile?.verificationStatus as any) || "APPROVED",
        },
        inventory: {
          availableQty,
          reservedQty,
          stockStatus,
        },
        images: p.images.map((img: any) => ({ id: img.id, imageUrl: img.imageUrl })),
        primaryImage,
      };
    };

    const formattedProducts = productsRaw.map(formatProductItem);

    // Featured Products (Top 3 by available inventory or creation)
    const featuredProducts = formattedProducts.slice(0, 3);

    const totalPages = Math.ceil(totalMatches / limit) || 1;

    const dto: MarketplaceDTO = {
      products: formattedProducts,
      featuredProducts,
      categories: categoriesRaw.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        productCount: c._count.products,
      })),
      pagination: {
        page,
        limit,
        total: totalMatches,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      sortOptions: [
        { label: "Newest Harvests", value: "newest" },
        { label: "Price: Low to High", value: "price_asc" },
        { label: "Price: High to Low", value: "price_desc" },
        { label: "Oldest Harvests", value: "oldest" },
      ],
      searchMetadata: {
        query: search,
        selectedCategory: category,
        selectedState: state,
        minPrice,
        maxPrice,
        totalMatches,
      },
    };

    return NextResponse.json(dto, { status: 200 });
  } catch (error: any) {
    console.error("Error generating MarketplaceDTO:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error fetching MarketplaceDTO." },
      { status: 500 }
    );
  }
}
