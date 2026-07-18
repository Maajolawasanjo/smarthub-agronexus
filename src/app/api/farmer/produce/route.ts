import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      farmerProfileId,
      name,
      categoryId,
      description,
      price,
      moq = 1,
      unit = "Metric Ton",
      stockQuantity = 50,
      grade = "Grade A",
      imageUrl,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Product name and price are required." },
        { status: 400 }
      );
    }

    // Check default category or create general fallback category
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const defaultCategory = await prisma.category.findFirst();
      if (defaultCategory) {
        finalCategoryId = defaultCategory.id;
      } else {
        const createdCategory = await prisma.category.create({
          data: {
            name: "Grains & Seeds",
            description: "Agricultural grains and export oilseeds",
          },
        });
        finalCategoryId = createdCategory.id;
      }
    }

    // Find farmer profile or fallback
    let farmerProfile = farmerProfileId
      ? await prisma.farmerProfile.findUnique({ where: { id: farmerProfileId } })
      : await prisma.farmerProfile.findFirst();

    if (!farmerProfile) {
      return NextResponse.json(
        { error: "Valid farmer profile is required to submit produce." },
        { status: 404 }
      );
    }

    // Create Product in pending state for admin inspection
    const newProduct = await prisma.product.create({
      data: {
        farmerProfileId: farmerProfile.id,
        categoryId: finalCategoryId,
        name: name.trim(),
        description: description?.trim() || `${name} produced for international export.`,
        price: parseFloat(price.toString()),
        moq: parseInt(moq.toString()),
        unit: unit.trim(),
        grade: grade.trim(),
        isAvailable: false, // Moderation pending
        images: imageUrl
          ? {
              create: [
                {
                  url: imageUrl,
                  isPrimary: true,
                },
              ],
            }
          : undefined,
        inventory: {
          create: {
            quantity: parseInt(stockQuantity.toString()),
            location: farmerProfile.farmAddress || "Farm Warehouse",
          },
        },
      },
      include: {
        category: true,
        images: true,
        inventory: true,
      },
    });

    return NextResponse.json(
      {
        message: "Produce submitted successfully for quality inspection.",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting farmer produce API:", error);
    return NextResponse.json(
      { error: "Internal server error submitting produce." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerProfileId = searchParams.get("farmerProfileId");

    const whereClause = farmerProfileId ? { farmerProfileId } : {};

    const produceList = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        images: true,
        inventory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ produce: produceList }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching farmer produce API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching farmer produce." },
      { status: 500 }
    );
  }
}
