import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    // Build Prisma query filter
    const whereClause: any = {
      isAvailable: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category.toLowerCase() !== "all") {
      whereClause.category = {
        name: { contains: category, mode: "insensitive" },
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        farmerProfile: {
          select: {
            farmName: true,
            state: true,
          },
        },
        images: true,
        inventory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching products." },
      { status: 500 }
    );
  }
}
