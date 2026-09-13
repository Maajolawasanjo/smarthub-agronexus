import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFarmerSession, getAdminSession, getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id: existingId,
      name,
      categoryId,
      description,
      price,
      unit = "KG",
      stockQuantity = 50,
      moq = 1,
      grade,
      condition,
      packaging,
      packageSize,
      availabilityStatus = "AVAILABLE_NOW",
      availableFrom,
      harvestDate,
      storageCondition,
      storageNotes,
      farmState,
      farmLga,
      farmCommunity,
      imageUrl,
      images,
      action = "SUBMIT", // "DRAFT" | "SUBMIT"
    } = body;

    // Model A Session Authentication with backward-compatible fallback
    let session: any = null;
    if (typeof getFarmerSession === "function") {
      session = await getFarmerSession();
    }
    if (!session && typeof getAdminSession === "function") {
      session = await getAdminSession();
    }
    if (!session && typeof getSession === "function") {
      session = await getSession();
    }

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to manage produce." },
        { status: 401 }
      );
    }

    // Resolve Farmer Profile
    let farmerProfile = null;
    if (session.role === "FARMER") {
      farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
        include: { user: true },
      });
    } else if (session.role === "ADMIN") {
      if (body.farmerProfileId) {
        farmerProfile = await prisma.farmerProfile.findUnique({
          where: { id: body.farmerProfileId },
          include: { user: true },
        });
      } else if (body.farmerName) {
        farmerProfile = await prisma.farmerProfile.findFirst({
          where: {
            OR: [
              { farmName: { contains: body.farmerName, mode: "insensitive" } },
              { user: { fullName: { contains: body.farmerName, mode: "insensitive" } } },
            ],
          },
          include: { user: true },
        });
      }
      if (!farmerProfile) {
        farmerProfile = await prisma.farmerProfile.findFirst({
          where: { verificationStatus: "APPROVED" },
          include: { user: true },
        });
      }
    }

    if (!farmerProfile) {
      return NextResponse.json(
        { error: "Valid farmer profile required. Please complete farmer registration." },
        { status: 403 }
      );
    }

    if (farmerProfile.user && !farmerProfile.user.isActive) {
      return NextResponse.json(
        { error: "Account suspended: Produce creation is disabled for frozen accounts." },
        { status: 403 }
      );
    }

    const isDraft = action === "DRAFT";

    // Required fields check:
    // Drafts require at least a title/name to save
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Produce name or title is required." },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price?.toString() || "0");
    const parsedStock = parseInt(stockQuantity?.toString() || "1", 10);
    const parsedMoq = Math.max(1, parseInt(moq?.toString() || "1", 10));

    // Full validation strictly enforced when SUBMITTING for Admin review
    if (!isDraft) {
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
          { error: "A valid asking price greater than ₦0 is required for submission." },
          { status: 400 }
        );
      }
      if (isNaN(parsedStock) || parsedStock <= 0) {
        return NextResponse.json(
          { error: "Available stock quantity must be at least 1." },
          { status: 400 }
        );
      }
      if (parsedMoq > parsedStock) {
        return NextResponse.json(
          { error: `Minimum Order Quantity (${parsedMoq}) cannot exceed total available stock (${parsedStock}).` },
          { status: 400 }
        );
      }

      // MKT-001: Verification Guard — Only APPROVED farmers can submit produce for listing moderation
      if (farmerProfile.verificationStatus !== "APPROVED" && session.role !== "ADMIN") {
        return NextResponse.json(
          {
            error: "Verification required: Your farmer profile must be approved by an administrator before you can submit produce for listing.",
          },
          { status: 403 }
        );
      }

      // Check future harvest date for currently available goods
      if (harvestDate && availabilityStatus === "AVAILABLE_NOW") {
        const parsedHarvest = new Date(harvestDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (parsedHarvest > today) {
          return NextResponse.json(
            { error: "Harvest date cannot be in the future for produce marked as 'Available Now'." },
            { status: 400 }
          );
        }
      }
    }

    // Category resolution
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

    // Normalize Unit
    const preservedUnit = unit && typeof unit === "string" ? unit.trim().toUpperCase() : "PIECE";
    let validUnit: "KG" | "BAG" | "TON" | "CRATE" | "PIECE" = "PIECE";
    if (preservedUnit.includes("BAG")) validUnit = "BAG";
    else if (preservedUnit.includes("TON")) validUnit = "TON";
    else if (preservedUnit.includes("CRATE")) validUnit = "CRATE";
    else if (preservedUnit.includes("KG")) validUnit = "KG";
    else validUnit = "PIECE";

    // Collect images
    const imageList: string[] = Array.isArray(images) && images.length > 0 
      ? images.filter((img): img is string => typeof img === "string" && img.length > 0)
      : imageUrl ? [imageUrl] : [];

    // Structured Location fallback to profile if empty
    const resolvedState = farmState?.trim() || farmerProfile.state || "Taraba";
    const resolvedLga = farmLga?.trim() || farmerProfile.lga || "";
    const resolvedCommunity = farmCommunity?.trim() || "";

    // Status:
    // DRAFT -> status: "DRAFT", isAvailable: false
    // SUBMIT -> status: "PENDING_APPROVAL", isAvailable: false (never bypasses Admin Review!)
    const productStatus = isDraft ? "DRAFT" : "PENDING_APPROVAL";
    const productAvailability = false;

    let targetProduct = null;

    // Check if updating existing listing (e.g. existing draft or rejected item)
    if (existingId) {
      const existing = await prisma.product.findUnique({
        where: { id: existingId },
      });

      if (existing) {
        // Authorization check: Must own the produce or be admin
        if (existing.farmerProfileId !== farmerProfile.id && session.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Access denied: You do not have permission to modify this listing." },
            { status: 403 }
          );
        }

        // Update product
        targetProduct = await prisma.product.update({
          where: { id: existingId },
          data: {
            categoryId: finalCategoryId,
            name: name.trim(),
            description: description?.trim() || `${name} produced for wholesale export.`,
            price: parsedPrice,
            unit: validUnit,
            status: productStatus,
            isAvailable: productAvailability,
            harvestDate: harvestDate ? new Date(harvestDate) : null,
            moq: parsedMoq,
            grade: grade?.trim() || null,
            condition: condition?.trim() || null,
            packaging: packaging?.trim() || null,
            packageSize: packageSize?.trim() || null,
            availabilityStatus: availabilityStatus?.trim() || "AVAILABLE_NOW",
            availableFrom: availableFrom ? new Date(availableFrom) : null,
            storageCondition: storageCondition?.trim() || null,
            storageNotes: storageNotes?.trim() || null,
            farmState: resolvedState,
            farmLga: resolvedLga,
            farmCommunity: resolvedCommunity,
            // If new images provided, recreate them
            ...(imageList.length > 0
              ? {
                  images: {
                    deleteMany: {},
                    create: imageList.map((url) => ({ imageUrl: url })),
                  },
                }
              : {}),
            inventory: {
              upsert: {
                create: {
                  availableQty: parsedStock,
                  reservedQty: 0,
                },
                update: {
                  availableQty: parsedStock,
                },
              },
            },
          },
          include: {
            category: true,
            images: true,
            inventory: true,
          },
        });
      }
    }

    // If not updating existing, create new product
    if (!targetProduct) {
      targetProduct = await prisma.product.create({
        data: {
          farmerProfileId: farmerProfile.id,
          categoryId: finalCategoryId,
          name: name.trim(),
          description: description?.trim() || `${name} produced for wholesale export.`,
          price: parsedPrice,
          unit: validUnit,
          status: productStatus,
          isAvailable: productAvailability,
          harvestDate: harvestDate ? new Date(harvestDate) : null,
          moq: parsedMoq,
          grade: grade?.trim() || null,
          condition: condition?.trim() || null,
          packaging: packaging?.trim() || null,
          packageSize: packageSize?.trim() || null,
          availabilityStatus: availabilityStatus?.trim() || "AVAILABLE_NOW",
          availableFrom: availableFrom ? new Date(availableFrom) : null,
          storageCondition: storageCondition?.trim() || null,
          storageNotes: storageNotes?.trim() || null,
          farmState: resolvedState,
          farmLga: resolvedLga,
          farmCommunity: resolvedCommunity,
          images: imageList.length > 0
            ? {
                create: imageList.map((url: string) => ({ imageUrl: url })),
              }
            : undefined,
          inventory: {
            create: {
              availableQty: parsedStock,
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
    }

    return NextResponse.json(
      {
        message: isDraft
          ? "Listing saved as draft successfully."
          : "Produce submitted successfully for quality inspection and admin approval.",
        product: targetProduct,
        isDraft,
        isLive: false,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
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
    const statusParam = searchParams.get("status");

    // Model A Session Authentication with backward-compatible fallback
    let session: any = null;
    if (typeof getFarmerSession === "function") {
      session = await getFarmerSession();
    }
    if (!session && typeof getAdminSession === "function") {
      session = await getAdminSession();
    }
    if (!session && typeof getSession === "function") {
      session = await getSession();
    }

    let whereClause: Record<string, unknown> = {};

    if (session?.userId && session.role === "FARMER") {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (farmerProfile) {
        whereClause.farmerProfileId = farmerProfile.id;
      }
    } else if (farmerProfileId) {
      whereClause.farmerProfileId = farmerProfileId;
    }

    if (statusParam && statusParam.toUpperCase() !== "ALL") {
      whereClause.status = statusParam.toUpperCase();
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
  } catch (error: unknown) {
    console.error("Error fetching farmer produce API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching farmer produce." },
      { status: 500 }
    );
  }
}
