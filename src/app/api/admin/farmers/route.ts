import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const verification = searchParams.get("verification") || "ALL"; // ALL, APPROVED, PENDING, REJECTED
    const accountStatus = searchParams.get("status") || "ALL"; // ALL, ACTIVE, SUSPENDED

    // Build filter conditions
    const where: any = {};

    if (verification !== "ALL") {
      where.verificationStatus = verification;
    }

    if (accountStatus === "ACTIVE") {
      where.user = { ...where.user, isActive: true };
    } else if (accountStatus === "SUSPENDED") {
      where.user = { ...where.user, isActive: false };
    }

    if (search) {
      where.OR = [
        { farmName: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { lga: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phoneNumber: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Fetch aggregate statistics & farmer profiles in parallel
    const [
      totalFarmers,
      verifiedProducers,
      pendingVerification,
      suspendedAccounts,
      farmers,
    ] = await Promise.all([
      prisma.farmerProfile.count(),
      prisma.farmerProfile.count({ where: { verificationStatus: "APPROVED" } }),
      prisma.farmerProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.farmerProfile.count({ where: { user: { isActive: false } } }),
      prisma.farmerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              isActive: true,
              createdAt: true,
            },
          },
          verification: {
            select: {
              id: true,
              documentType: true,
              documentNumber: true,
              documentUrl: true,
              reviewedAt: true,
              remarks: true,
            },
          },
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              unit: true,
              status: true,
              isAvailable: true,
              createdAt: true,
              images: {
                select: {
                  imageUrl: true,
                },
                take: 1,
              },
              inventory: {
                select: {
                  availableQty: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              products: true,
              sellerOrders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedFarmers = farmers.map((f) => {
      const activeProductsCount = f.products.filter(
        (p) => p.status === "APPROVED" && p.isAvailable
      ).length;

      const totalInventoryQty = f.products.reduce(
        (acc, p) => acc + (p.inventory?.availableQty || 0),
        0
      );

      return {
        id: f.id,
        userId: f.user.id,
        fullName: f.user.fullName,
        email: f.user.email,
        phoneNumber: f.user.phoneNumber,
        profileImage: f.user.profileImage,
        isActive: f.user.isActive,
        farmName: f.farmName,
        farmDescription: f.farmDescription,
        farmAddress: f.farmAddress,
        state: f.state,
        lga: f.lga,
        verificationStatus: f.verificationStatus,
        hasKycDoc: !!f.verification?.documentUrl,
        kycDocument: f.verification,
        totalProducts: f._count.products,
        activeProducts: activeProductsCount,
        totalOrders: f._count.sellerOrders,
        totalInventoryQty,
        sampleProducts: f.products.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          unit: p.unit,
          status: p.status,
          image: p.images[0]?.imageUrl || null,
          availableQty: p.inventory?.availableQty || 0,
        })),
        createdAt: f.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      statistics: {
        totalFarmers,
        verifiedProducers,
        pendingVerification,
        suspendedAccounts,
      },
      farmers: formattedFarmers,
    });
  } catch (error) {
    console.error("Error fetching admin farmers directory:", error);
    return NextResponse.json(
      { error: "Internal server error fetching farmers directory." },
      { status: 500 }
    );
  }
}
