import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/farmer/analytics — Fetch deep SQL analytics for farmer dashboard
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required for analytics access."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: session.userId },
      include: { products: true },
    });

    if (!farmerProfile) {
      const res = NextResponse.json(
        createErrorResponse("FORBIDDEN", "Account does not have a valid farmer profile."),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProductIds = farmerProfile.products.map((p) => p.id);

    if (farmerProductIds.length === 0) {
      const res = NextResponse.json(
        createSuccessResponse({
          totalGrossRevenue: 0,
          totalNetPayout: 0,
          totalPlatformFees: 0,
          totalVatFees: 0,
          fulfillmentRatePct: 100,
          topPerformingProduce: [],
          monthlySalesTrend: [],
        })
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Fetch all completed/delivered order items
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: farmerProductIds } },
      include: { order: true, product: true },
    });

    const completedItems = orderItems.filter((i) =>
      ["DELIVERED", "COMPLETED"].includes(i.order.status)
    );

    const totalGrossRevenue = completedItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const PLATFORM_FEE_PCT = 0.025; // 2.5%
    const VAT_PCT = 0.075; // 7.5%

    const totalPlatformFees = totalGrossRevenue * PLATFORM_FEE_PCT;
    const totalVatFees = totalGrossRevenue * VAT_PCT;
    const totalNetPayout = totalGrossRevenue - totalPlatformFees;

    const totalOrdersCount = new Set(orderItems.map((i) => i.orderId)).size;
    const completedOrdersCount = new Set(completedItems.map((i) => i.orderId)).size;
    const fulfillmentRatePct = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 100;

    // Aggregate sales per produce item
    const produceSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const item of completedItems) {
      const pid = item.productId;
      const qty = item.quantity;
      const subtotal = Number(item.subtotal);
      const name = item.product?.name || "Agro Produce";

      if (!produceSalesMap.has(pid)) {
        produceSalesMap.set(pid, { name, quantity: 0, revenue: 0 });
      }

      const rec = produceSalesMap.get(pid)!;
      rec.quantity += qty;
      rec.revenue += subtotal;
    }

    const topPerformingProduce = Array.from(produceSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        formattedRevenue: `₦${p.revenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
      }));

    // Monthly Sales Trend (Last 6 Months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlySalesTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const yearVal = d.getFullYear();

      const itemsInMonth = completedItems.filter((item) => {
        const itemDate = new Date(item.order.createdAt);
        return itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === yearVal;
      });

      const revenue = itemsInMonth.reduce((sum, item) => sum + Number(item.subtotal), 0);

      monthlySalesTrend.push({
        month: `${monthLabel} ${yearVal}`,
        revenue: Math.round(revenue),
        orders: new Set(itemsInMonth.map((i) => i.orderId)).size,
      });
    }

    const res = NextResponse.json(
      createSuccessResponse({
        totalGrossRevenue,
        formattedTotalGrossRevenue: `₦${totalGrossRevenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        totalNetPayout,
        formattedTotalNetPayout: `₦${totalNetPayout.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        totalPlatformFees,
        formattedTotalPlatformFees: `₦${totalPlatformFees.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        totalVatFees,
        formattedTotalVatFees: `₦${totalVatFees.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        fulfillmentRatePct,
        totalOrdersCount,
        completedOrdersCount,
        topPerformingProduce,
        monthlySalesTrend,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in GET /api/farmer/analytics:", err);
    const res = NextResponse.json(
      createErrorResponse("ANALYTICS_FETCH_FAILED", err.message || "Failed to generate farmer analytics."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
