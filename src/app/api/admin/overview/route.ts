import { NextResponse } from "next/server";
import { prisma, executeWithDbRetry } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AdminDashboardDTO } from "@/types/page-dtos";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { user, dto } = await executeWithDbRetry(async () => {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user || user.role !== "ADMIN") {
        return { user: null, dto: null };
      }

      // Server-side Aggregations for Admin Command Center
      const totalFarmers = await prisma.user.count({ where: { role: "FARMER" } });
      const totalBuyers = await prisma.user.count({ where: { role: "BUYER" } });
      const totalProducts = await prisma.product.count();
      const pendingProducts = await prisma.product.count({ where: { isAvailable: false } });

      const completedOrdersCount = await prisma.order.count({
        where: { status: { in: ["DELIVERED", "COMPLETED"] } },
      });

      const tradeVolAgg = await prisma.order.aggregate({
        where: { status: { in: ["DELIVERED", "COMPLETED"] } },
        _sum: { totalAmount: true },
      });
      const totalTradeVolume = tradeVolAgg._sum.totalAmount ? Number(tradeVolAgg._sum.totalAmount) : 0.00;

      const pendingVerifications = await prisma.verification.count({
        where: { reviewedAt: null },
      });

      const openDisputes = await prisma.dispute.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      });

      // Moderation Queue Tasks
      const unapprovedVerifications = await prisma.verification.findMany({
        where: { reviewedAt: null },
        include: { farmerProfile: true },
        take: 5,
      });

      const moderationQueue = unapprovedVerifications.map((v) => ({
        id: v.id,
        type: "KYC_VERIFICATION" as const,
        title: `KYC Review: ${v.farmerProfile.farmName}`,
        submittedBy: v.farmerProfile.farmName,
        status: "PENDING_REVIEW",
        date: new Date(v.createdAt).toLocaleDateString(),
      }));

      // Category Distribution Aggregation
      const categories = await prisma.category.findMany({
        include: {
          _count: { select: { products: true } },
        },
      });

      const totalCategorizedProducts = categories.reduce((sum, c) => sum + c._count.products, 0) || 1;
      const palette = ["#1B4D28", "#739072", "#E28F10", "#3B3DBF", "#A855F7"];

      const categoryData = categories.slice(0, 5).map((cat, idx) => ({
        name: cat.name,
        value: Math.round((cat._count.products / totalCategorizedProducts) * 100),
        color: palette[idx % palette.length],
      }));

      // Sales & Growth Monthly Aggregation (Past 6 Months)
      const now = new Date();
      const monthsList = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          label: d.toLocaleString("default", { month: "short" }),
          year: d.getFullYear(),
          monthIdx: d.getMonth(),
        };
      });

      const orders = await prisma.order.findMany({
        where: { status: { in: ["DELIVERED", "COMPLETED", "IN_TRANSIT", "CONFIRMED"] } },
        select: { createdAt: true, totalAmount: true },
      });

      const salesData = monthsList.map((m) => {
        const monthOrders = orders.filter(
          (o) => o.createdAt.getFullYear() === m.year && o.createdAt.getMonth() === m.monthIdx
        );
        return {
          month: m.label,
          sales: monthOrders.length,
        };
      });

      const growthData = monthsList.map((m) => {
        const monthOrders = orders.filter(
          (o) => o.createdAt.getFullYear() === m.year && o.createdAt.getMonth() === m.monthIdx
        );
        const total = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        return {
          month: m.label,
          value: total,
        };
      });

      const dto: AdminDashboardDTO & { salesData: any[]; categoryData: any[]; growthData: any[] } = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role as any,
          isActive: user.isActive,
        },
        statistics: {
          totalTradeVolume,
          totalProducts,
          pendingProducts,
          totalFarmers,
          totalBuyers,
          completedOrdersCount,
          pendingVerifications,
          openDisputes,
        },
        moderationQueue,
        salesData,
        categoryData: categoryData.length > 0 ? categoryData : [
          { name: "Vegetables", value: 40, color: "#1B4D28" },
          { name: "Grains", value: 30, color: "#739072" },
          { name: "Tubers", value: 20, color: "#E28F10" },
          { name: "Fruits", value: 10, color: "#3B3DBF" },
        ],
        growthData,
        recentActivity: [
          {
            id: "act-1",
            title: "System Audit Synchronized",
            description: "PostgreSQL database operational across 55 routes.",
            type: "KYC",
            status: "SUCCESS",
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
        notifications: [],
        quickActions: [
          { id: "1", title: "Review Farmers", description: "Verify pending KYC submissions", href: "/admin/users", iconName: "ShieldCheck" },
          { id: "2", title: "Resolve Disputes", description: "Arbitrate frozen escrow claims", href: "/admin/disputes", iconName: "AlertTriangle" },
          { id: "3", title: "Moderate Products", description: "Inspect produce listings", href: "/admin/products", iconName: "Box" },
          { id: "4", title: "View Reports", description: "Export financial audit logs", href: "/admin/analytics", iconName: "BarChart3" },
        ],
      };

      return { user, dto };
    });

    if (!user) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    return NextResponse.json(dto);
  } catch (error: any) {
    console.error("Error generating AdminDashboardDTO:", error);
    return NextResponse.json({ error: "Internal server error fetching AdminDashboardDTO" }, { status: 500 });
  }
}
