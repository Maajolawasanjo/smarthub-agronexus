import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      productCount: c._count.products,
    }));

    return NextResponse.json({ categories: formattedCategories }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching categories API:", error);
    return NextResponse.json({ error: "Internal server error fetching categories." }, { status: 500 });
  }
}
