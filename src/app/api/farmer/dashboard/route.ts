import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FarmerDashboardDTO } from "@/types/page-dtos";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        farmerProfile: {
          include: {
            verification: true,
            products: {
              include: {
                inventory: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Farmer user profile not found" }, { status: 404 });
    }

    const farmerProfile = user.farmerProfile;

    if (!farmerProfile) {
      return NextResponse.json({ error: "Account does not have a farmer profile" }, { status: 400 });
    }

    // Active Products & Inventory Stats
    const activeProductsList = farmerProfile.products.filter(
      (p) => p.isAvailable && (p.inventory?.availableQty ?? 0) > 0
    );
    const totalProducts = activeProductsList.length;
    const totalAvailableQty = activeProductsList.reduce(
      (sum, p) => sum + (p.inventory?.availableQty ?? 0),
      0
    );

    // Fetch Farmer Orders
    const farmerProductIds = farmerProfile.products.map((p) => p.id);

    const farmerOrderItems = farmerProductIds.length > 0
      ? await prisma.orderItem.findMany({
          where: { productId: { in: farmerProductIds } },
          include: { order: true },
        })
      : [];

    const pendingOrders = farmerOrderItems.filter((item) => item.order.status === "PENDING").length;
    const activeOrders = farmerOrderItems.filter((item) =>
      ["CONFIRMED", "PROCESSING", "IN_TRANSIT"].includes(item.order.status)
    ).length;

    const completedItems = farmerOrderItems.filter((item) =>
      ["DELIVERED", "COMPLETED"].includes(item.order.status)
    );

    // Wallet Ledger-backed revenue calculation
    const farmerWallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
      include: {
        transactions: {
          where: { type: "ESCROW_RELEASE", status: "SUCCESS" },
        },
      },
    });

    const ledgerRevenue = farmerWallet?.transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    ) ?? 0;

    const orderSubtotalRevenue = completedItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0.00
    );

    const revenue = ledgerRevenue > 0 ? ledgerRevenue : orderSubtotalRevenue;
    const totalSales = completedItems.length;

    // Submissions
    const recentSubmissions = farmerProfile.products.slice(0, 5).map((p) => ({
      id: p.id,
      produceName: p.name,
      price: Number(p.price),
      unit: p.unit,
      availableQty: p.inventory?.availableQty ?? 0,
      date: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: p.isAvailable ? "AVAILABLE" : "OUT_OF_STOCK",
    }));

    // Server-computed Profile Completion
    const completedFields: string[] = [];
    const missingFields: string[] = [];

    if (farmerProfile.farmName) completedFields.push("Farm Name"); else missingFields.push("Farm Name");
    if (farmerProfile.farmAddress) completedFields.push("Farm Location"); else missingFields.push("Farm Location");
    if (farmerProfile.state) completedFields.push("State"); else missingFields.push("State");
    if (farmerProfile.verification) completedFields.push("KYC Documents Uploaded"); else missingFields.push("KYC Documents Uploaded");

    const percentage = Math.round((completedFields.length / 4) * 100);

    const dto: FarmerDashboardDTO = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role as any,
        isActive: user.isActive,
      },
      farmerProfile: {
        farmName: farmerProfile.farmName,
        farmAddress: farmerProfile.farmAddress,
        state: farmerProfile.state,
        lga: farmerProfile.lga,
        verificationStatus: farmerProfile.verificationStatus as any,
      },
      statistics: {
        pendingOrders,
        activeOrders,
        revenue,
        totalSales,
        totalProducts,
        totalAvailableQty,
      },
      recentSubmissions,
      recentActivity: farmerProfile.products.slice(0, 5).map((p) => ({
        id: p.id,
        title: `Listed ${p.name}`,
        description: `Price: $${Number(p.price)} per ${p.unit}`,
        type: "PRODUCT",
        status: p.isAvailable ? "ACTIVE" : "INACTIVE",
        timestamp: new Date(p.createdAt).toLocaleTimeString(),
      })),
      quickActions: [
        { id: "1", title: "Add Farm Produce", description: "List new harvest stock", href: "/farmer/sell", iconName: "PlusCircle" },
        { id: "2", title: "Manage Listings", description: "Update inventory & pricing", href: "/farmer/listings", iconName: "ListFilter" },
        { id: "3", title: "View Payouts", description: "Track wallet earnings", href: "/farmer/wallet", iconName: "Wallet" },
        { id: "4", title: "KYC Verification", description: "Upload identity documents", href: "/farmer/kyc", iconName: "ShieldCheck" },
      ],
      profileCompletion: {
        percentage,
        completedFields,
        missingFields,
        recommendedNextAction: percentage < 100 ? `Complete ${missingFields[0]}` : "Farmer Profile Verified",
      },
      chartData: (() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const now = new Date();
        const chart: { day: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayName = days[d.getDay()];
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

          const dailyVol = farmerOrderItems
            .filter((item) => {
              const created = new Date(item.order.createdAt);
              return created >= dayStart && created <= dayEnd && item.order.status !== "CANCELLED";
            })
            .reduce((sum, item) => sum + Number(item.subtotal), 0);

          chart.push({ day: dayName, value: Math.round(dailyVol) });
        }
        return chart;
      })(),
    };

    return NextResponse.json(dto);
  } catch (error: any) {
    console.error("Error generating FarmerDashboardDTO:", error);
    return NextResponse.json({ error: "Internal server error fetching FarmerDashboardDTO" }, { status: 500 });
  }
}
