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
      unit = "KG",
      stockQuantity = 50,
      imageUrl,
      images,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Product name and price are required." },
        { status: 400 }
      );
    }

    // Smart category resolution based on product name / produce type
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const lowerName = String(name).toLowerCase();
      let targetCatName = "Grains & Seeds";
      if (lowerName.includes("yam") || lowerName.includes("cassava") || lowerName.includes("tuber") || lowerName.includes("potato") || lowerName.includes("cocoyam")) {
        targetCatName = "Tubers & Roots";
      } else if (lowerName.includes("tomato") || lowerName.includes("onion") || lowerName.includes("pepper") || lowerName.includes("vegetable")) {
        targetCatName = "Vegetables";
      } else if (lowerName.includes("cocoa") || lowerName.includes("cashew") || lowerName.includes("sesame") || lowerName.includes("oil") || lowerName.includes("ginger")) {
        targetCatName = "Cash Crops";
      } else if (lowerName.includes("maize") || lowerName.includes("rice") || lowerName.includes("grain") || lowerName.includes("wheat") || lowerName.includes("soybean")) {
        targetCatName = "Grains & Seeds";
      }

      let category = await prisma.category.findFirst({
        where: { name: { contains: targetCatName, mode: "insensitive" } },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: targetCatName,
            description: `${targetCatName} agricultural commodities for wholesale and export`,
          },
        });
      }
      finalCategoryId = category.id;
    }

    // Authenticated Session Farmer Resolution
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    let farmerProfile = null;
    if (session?.userId) {
      farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
        include: { user: true },
      });
    }

    if (!farmerProfile && farmerProfileId) {
      farmerProfile = await prisma.farmerProfile.findUnique({
        where: { id: farmerProfileId },
        include: { user: true },
      });
    }

    if (!farmerProfile && session?.userId) {
      const u = await prisma.user.findUnique({ where: { id: session.userId } });
      if (u) {
        farmerProfile = await prisma.farmerProfile.create({
          data: {
            userId: u.id,
            farmName: `${u.fullName}'s Farm`,
            farmAddress: "Taraba State, Nigeria",
            state: "Taraba State",
            lga: "Zing",
            verificationStatus: "APPROVED",
          },
          include: { user: true },
        });
      }
    }

    if (!farmerProfile) {
      farmerProfile = await prisma.farmerProfile.findFirst({
        where: { user: { isActive: true } },
        include: { user: true },
      });
    }

    if (!farmerProfile) {
      return NextResponse.json(
        { error: "Valid farmer profile is required to submit produce. Please complete your registration." },
        { status: 404 }
      );
    }

    if (farmerProfile.user && !farmerProfile.user.isActive) {
      return NextResponse.json(
        { error: "Account suspended: Produce creation is disabled for frozen accounts." },
        { status: 403 }
      );
    }

    // Update farmer profile location if provided in request
    const { farmLocation } = body;
    if (farmLocation && typeof farmLocation === "string") {
      const parts = farmLocation.split(",").map((s: string) => s.trim());
      const statePart = parts.find(p => p.toLowerCase().includes("state")) || parts[parts.length - 2] || parts[0];
      const lgaPart = parts[0];
      try {
        await prisma.farmerProfile.update({
          where: { id: farmerProfile.id },
          data: {
            farmAddress: farmLocation,
            state: statePart ? statePart.trim() : farmerProfile.state,
            lga: lgaPart ? lgaPart.trim() : farmerProfile.lga,
          },
        });
      } catch (locErr) {
        console.warn("Could not update farmer location:", locErr);
      }
    }

    // Trust Engine Policy Enforcement
    const { evaluateTrustPolicy } = await import("@/lib/trust");
    const trustPolicy = evaluateTrustPolicy(farmerProfile.verificationStatus);

    if (!trustPolicy.canPublishProducts) {
      return NextResponse.json(
        { error: "Your current trust status does not allow publishing produce. Complete verification first." },
        { status: 403 }
      );
    }

    if (trustPolicy.listingLimit > 0) {
      const activeCount = await prisma.product.count({
        where: { farmerProfileId: farmerProfile.id },
      });
      if (activeCount >= trustPolicy.listingLimit) {
        return NextResponse.json(
          {
            error: `Tier 1 limit reached. Unverified accounts can list at most ${trustPolicy.listingLimit} active produce items. Complete identity verification to unlock unlimited listings.`,
          },
          { status: 403 }
        );
      }
    }

    // Create Product in pending state for admin inspection
    const preservedUnit = unit && typeof unit === "string" ? unit.trim() : "PIECE";
    let validUnit: "KG" | "BAG" | "TON" | "CRATE" | "PIECE" = "PIECE";
    const uUpper = preservedUnit.toUpperCase();
    if (uUpper.includes("BAG")) validUnit = "BAG";
    else if (uUpper.includes("TON")) validUnit = "TON";
    else if (uUpper.includes("CRATE")) validUnit = "CRATE";
    else if (uUpper.includes("KG")) validUnit = "KG";
    else validUnit = "PIECE";

    const imageList: string[] = Array.isArray(images) && images.length > 0 
      ? images.filter((img): img is string => typeof img === "string" && img.length > 0)
      : imageUrl ? [imageUrl] : [];

    const newProduct = await prisma.product.create({
      data: {
        farmerProfileId: farmerProfile.id,
        categoryId: finalCategoryId,
        name: name.trim(),
        description: description?.trim() || `${name} produced for wholesale export.`,
        price: parseFloat(price.toString()),
        unit: validUnit,
        isAvailable: false,
        images: imageList.length > 0
          ? {
              create: imageList.map((imgUrl: string) => ({ imageUrl: imgUrl })),
            }
          : undefined,
        inventory: {
          create: {
            availableQty: parseInt(stockQuantity.toString()),
            reservedQty: 0,
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

    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    let whereClause: any = {};

    if (session?.userId && session.role === "FARMER") {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (farmerProfile) {
        whereClause = { farmerProfileId: farmerProfile.id };
      }
    } else if (farmerProfileId) {
      whereClause = { farmerProfileId };
    }

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
