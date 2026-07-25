import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/farmer/customers — List buyers who have purchased produce from the logged-in farmer
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to access customer analytics."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: session.userId },
      include: { products: { select: { id: true } } },
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
          totalCustomersCount: 0,
          repeatCustomersCount: 0,
          totalCustomerLifetimeValue: 0,
          customers: [],
        })
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Query order items containing farmer's products
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: farmerProductIds } },
      include: {
        order: {
          include: {
            buyer: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate metrics per buyer
    const customerMap = new Map<string, any>();

    for (const item of orderItems) {
      const buyer = item.order.buyer;
      if (!buyer) continue;

      const buyerId = buyer.id;
      const subtotal = Number(item.subtotal);

      if (!customerMap.has(buyerId)) {
        customerMap.set(buyerId, {
          buyerId,
          userId: buyer.user?.id,
          fullName: buyer.user?.fullName || "Verified Marketplace Buyer",
          email: buyer.user?.email || "buyer@smarthub.ng",
          phoneNumber: buyer.user?.phoneNumber || "N/A",
          companyName: buyer.state ? `${buyer.lga || "LGA"}, ${buyer.state}` : "Marketplace Buyer",
          location: buyer.address || `${buyer.state || "Lagos"}, Nigeria`,

          totalOrdersCount: 0,
          totalSpend: 0,
          lastOrderDate: item.order.createdAt,
          orderIds: new Set<string>(),
        });
      }

      const record = customerMap.get(buyerId);
      record.totalSpend += subtotal;
      record.orderIds.add(item.order.id);
      if (new Date(item.order.createdAt) > new Date(record.lastOrderDate)) {
        record.lastOrderDate = item.order.createdAt;
      }
    }

    const customers = Array.from(customerMap.values()).map((c) => ({
      buyerId: c.buyerId,
      userId: c.userId,
      fullName: c.fullName,
      email: c.email,
      phoneNumber: c.phoneNumber,
      companyName: c.companyName,
      location: c.location,
      totalOrdersCount: c.orderIds.size,
      totalSpend: c.totalSpend,
      formattedTotalSpend: `₦${c.totalSpend.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
      lastOrderDate: new Date(c.lastOrderDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
    }));

    const repeatCustomersCount = customers.filter((c) => c.totalOrdersCount > 1).length;
    const totalCustomerLifetimeValue = customers.reduce((sum, c) => sum + c.totalSpend, 0);

    const res = NextResponse.json(
      createSuccessResponse({
        totalCustomersCount: customers.length,
        repeatCustomersCount,
        totalCustomerLifetimeValue,
        formattedTotalCustomerLifetimeValue: `₦${totalCustomerLifetimeValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
        customers,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in GET /api/farmer/customers:", err);
    const res = NextResponse.json(
      createErrorResponse("CUSTOMER_FETCH_FAILED", err.message || "Failed to fetch farmer customer directory."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
