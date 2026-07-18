import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const [
      totalProducts,
      pendingProducts,
      totalFarmers,
      totalBuyers,
      orders,
      completedOrdersCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isAvailable: false } }),
      prisma.farmerProfile.count(),
      prisma.buyerProfile.count(),
      prisma.order.findMany({ select: { totalAmount: true } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);

    const totalTradeVolume = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount.toString()),
      0
    );

    return NextResponse.json(
      {
        metrics: {
          totalTradeVolume,
          totalProducts,
          pendingProducts,
          totalFarmers,
          totalBuyers,
          completedOrdersCount,
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
