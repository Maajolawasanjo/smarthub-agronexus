import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DashboardDTO } from "@/types/page-dtos";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        buyerProfile: true,
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const buyerId = user.buyerProfile?.id;

    // Server-side Aggregations for Buyer Dashboard
    const totalOrdersCount = buyerId
      ? await prisma.order.count({ where: { buyerId } })
      : 0;

    const activeOrdersCount = buyerId
      ? await prisma.order.count({
          where: { buyerId, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "IN_TRANSIT"] } },
        })
      : 0;

    const completedOrdersCount = buyerId
      ? await prisma.order.count({
          where: { buyerId, status: { in: ["DELIVERED", "COMPLETED"] } },
        })
      : 0;

    const pendingDeliveriesCount = buyerId
      ? await prisma.order.count({
          where: { buyerId, status: "IN_TRANSIT" },
        })
      : 0;

    const spentAgg = buyerId
      ? await prisma.order.aggregate({
          where: { buyerId, status: { in: ["DELIVERED", "COMPLETED"] } },
          _sum: { totalAmount: true },
        })
      : { _sum: { totalAmount: null } };

    const totalSpent = spentAgg._sum.totalAmount ? Number(spentAgg._sum.totalAmount) : 0.00;

    const escrowAgg = buyerId
      ? await prisma.order.aggregate({
          where: { buyerId, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "IN_TRANSIT"] } },
          _sum: { totalAmount: true },
        })
      : { _sum: { totalAmount: null } };

    const escrowBalance = escrowAgg._sum.totalAmount ? Number(escrowAgg._sum.totalAmount) : 0.00;

    // Recent Orders
    const recentOrdersRaw = buyerId
      ? await prisma.order.findMany({
          where: { buyerId },
          include: { orderItems: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [];

    const recentOrders = recentOrdersRaw.map((ord) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      produce: ord.orderItems[0]?.product?.name || "Bulk Commodities",
      farmer: "SmartHub Verified Farmer",
      amount: Number(ord.totalAmount),
      status: ord.status,
      date: new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }));

    // Server-computed Profile Completion
    const completedFields: string[] = [];
    const missingFields: string[] = [];

    if (user.fullName) completedFields.push("Full Name"); else missingFields.push("Full Name");
    if (user.phoneNumber) completedFields.push("Phone Number"); else missingFields.push("Phone Number");
    if (user.buyerProfile?.address) completedFields.push("Shipping Address"); else missingFields.push("Shipping Address");
    if (user.buyerProfile?.state) completedFields.push("State"); else missingFields.push("State");

    const percentage = Math.round((completedFields.length / 4) * 100);

    const dto: DashboardDTO = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role as any,
        isActive: user.isActive,
      },
      profileSummary: {
        address: user.buyerProfile?.address || undefined,
        state: user.buyerProfile?.state || undefined,
        lga: user.buyerProfile?.lga || undefined,
        isProfileComplete: percentage >= 100,
      },
      walletSummary: {
        availableBalance: user.buyerProfile ? 845.30 : 0.00,
        escrowBalance,
        totalSpent,
      },
      statistics: {
        totalOrders: totalOrdersCount,
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        pendingDeliveries: pendingDeliveriesCount,
      },
      recentOrders,
      recentActivity: recentOrdersRaw.map((ord) => ({
        id: ord.id,
        title: `Order #${ord.orderNumber}`,
        description: `Order status updated to ${ord.status}`,
        type: "ORDER",
        status: ord.status,
        timestamp: new Date(ord.createdAt).toLocaleTimeString(),
      })),
      notifications: user.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type as any,
        isRead: n.isRead,
        createdAt: new Date(n.createdAt).toLocaleDateString(),
      })),
      quickActions: [
        { id: "1", title: "Browse Marketplace", description: "Source verified farm produce", href: "/dashboard/products", iconName: "Box" },
        { id: "2", title: "View Orders", description: "Track active order fulfillments", href: "/dashboard/orders", iconName: "ShoppingCart" },
        { id: "3", title: "Add Funds", description: "Deposit to buyer wallet", href: "/dashboard/wallet", iconName: "Wallet" },
        { id: "4", title: "Update Profile", description: "Complete account verification", href: "/dashboard/settings", iconName: "Settings" },
      ],
      profileCompletion: {
        percentage,
        completedFields,
        missingFields,
        recommendedNextAction: percentage < 100 ? `Add your ${missingFields[0] || "Shipping Address"}` : "Account 100% Complete",
      },
    };

    return NextResponse.json(dto);
  } catch (error: any) {
    console.error("Error generating DashboardDTO:", error);
    return NextResponse.json({ error: "Internal server error fetching DashboardDTO" }, { status: 500 });
  }
}
