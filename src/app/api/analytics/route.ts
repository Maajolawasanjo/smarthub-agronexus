import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    // 1. Overall platform metrics from PostgreSQL
    const [
      totalProducts,
      pendingProducts,
      totalFarmers,
      totalBuyers,
      orders,
      completedOrdersCount,
      pendingVerifications,
      openDisputes,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isAvailable: false } }),
      prisma.farmerProfile.count(),
      prisma.buyerProfile.count(),
      prisma.order.findMany({ select: { totalAmount: true } }),
      prisma.order.count({ where: { status: { in: ["DELIVERED", "COMPLETED"] } } }),
      prisma.farmerProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
    ]);

    const totalTradeVolume = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount.toString()),
      0
    );

    let userMetrics: any = null;

    // 2. User-specific live PostgreSQL metrics
    if (session && session.userId) {
      if (session.role === "BUYER") {
        const buyerProfile = await prisma.buyerProfile.findUnique({
          where: { userId: session.userId },
        });

        if (buyerProfile) {
          const [
            buyerTotalOrders,
            buyerActiveOrders,
            buyerCompletedOrders,
            buyerOrders,
            buyerRecentOrders,
          ] = await Promise.all([
            prisma.order.count({ where: { buyerId: buyerProfile.id } }),
            prisma.order.count({
              where: {
                buyerId: buyerProfile.id,
                status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "IN_TRANSIT"] },
              },
            }),
            prisma.order.count({
              where: {
                buyerId: buyerProfile.id,
                status: { in: ["DELIVERED", "COMPLETED"] },
              },
            }),
            prisma.order.findMany({
              where: { buyerId: buyerProfile.id },
              include: {
                orderItems: { include: { product: true } },
                payment: true,
              },
              orderBy: { createdAt: "desc" },
            }),
            prisma.order.findMany({
              where: { buyerId: buyerProfile.id },
              include: {
                orderItems: { include: { product: true } },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            }),
          ]);

          const buyerTotalSpent = buyerOrders
            .filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED")
            .reduce((acc, o) => acc + parseFloat(o.totalAmount.toString()), 0);

          const buyerEscrowBalance = buyerOrders
            .filter((o) => o.status !== "DELIVERED" && o.status !== "COMPLETED" && o.status !== "CANCELLED")
            .reduce((acc, o) => acc + parseFloat(o.totalAmount.toString()), 0);

          userMetrics = {
            totalOrders: buyerTotalOrders,
            activeOrders: buyerActiveOrders,
            completedOrders: buyerCompletedOrders,
            totalSpent: buyerTotalSpent,
            escrowBalance: buyerEscrowBalance,
            recentOrders: buyerRecentOrders.map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              name: o.orderItems[0]?.product?.name || "Bulk Produce",
              status: o.status,
              totalAmount: parseFloat(o.totalAmount.toString()),
              date: o.createdAt.toLocaleDateString(),
            })),
          };
        }
      } else if (session.role === "FARMER") {
        const farmerProfile = await prisma.farmerProfile.findUnique({
          where: { userId: session.userId },
        });

        if (farmerProfile) {
          const [
            farmerProductsCount,
            recentSubmissions,
            farmerOrderItems,
          ] = await Promise.all([
            prisma.product.count({ where: { farmerProfileId: farmerProfile.id } }),
            prisma.product.findMany({
              where: { farmerProfileId: farmerProfile.id },
              orderBy: { createdAt: "desc" },
              take: 5,
            }),
            prisma.orderItem.findMany({
              where: { product: { farmerProfileId: farmerProfile.id } },
              include: { order: true },
            }),
          ]);

          const pendingOrdersCount = farmerOrderItems.filter((i) => i.order.status === "PENDING").length;
          const activeOrdersCount = farmerOrderItems.filter(
            (i) => ["CONFIRMED", "PROCESSING", "IN_TRANSIT"].includes(i.order.status)
          ).length;
          const completedSalesCount = farmerOrderItems.filter(
            (i) => ["DELIVERED", "COMPLETED"].includes(i.order.status)
          ).length;

          const farmerRevenue = farmerOrderItems
            .filter((i) => ["DELIVERED", "COMPLETED"].includes(i.order.status))
            .reduce((acc, i) => acc + parseFloat(i.subtotal.toString()), 0);

          userMetrics = {
            productsCount: farmerProductsCount,
            pendingOrders: pendingOrdersCount,
            activeOrders: activeOrdersCount,
            totalSales: completedSalesCount,
            revenue: farmerRevenue,
            recentSubmissions: recentSubmissions.map((p) => ({
              id: p.id,
              name: p.name,
              type: p.unit,
              date: p.createdAt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
              status: p.isAvailable ? "Successful" : "Pending",
            })),
          };
        }
      }
    }

    return NextResponse.json(
      {
        metrics: {
          totalTradeVolume,
          totalProducts,
          pendingProducts,
          totalFarmers,
          totalBuyers,
          completedOrdersCount,
          pendingVerifications,
          openDisputes,
          userMetrics,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching analytics." },
      { status: 500 }
    );
  }
}
