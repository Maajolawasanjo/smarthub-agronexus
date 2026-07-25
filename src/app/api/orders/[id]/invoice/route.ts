import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/orders/[id]/invoice — Tax Invoice document endpoint
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id } = await params;

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { include: { user: true } },
        orderItems: { include: { product: { include: { farmerProfile: { include: { user: true } } } } } },
        payment: true,
      },
    });

    if (!order) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Order invoice not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const isAuthorized =
      session.role === "ADMIN" ||
      order.buyer.userId === session.userId ||
      order.orderItems.some((i) => i.product.farmerProfile.userId === session.userId);

    if (!isAuthorized) {
      const res = NextResponse.json(createErrorResponse("FORBIDDEN", "Access denied"), { status: 403 });
      return attachTraceHeaders(res, traceCtx);
    }

    const subtotal = Number(order.totalAmount);
    const taxVat = Number((subtotal * 0.075).toFixed(2)); // 7.5% VAT
    const grandTotal = subtotal + taxVat;

    const invoiceData = {
      invoiceNumber: `INV-${order.orderNumber}`,
      issueDate: order.createdAt.toISOString(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      buyer: {
        name: order.buyer.user.fullName,
        email: order.buyer.user.email,
        phone: order.buyer.user.phoneNumber || "—",
        address: order.buyer.address || "—",
      },
      items: order.orderItems.map((item) => ({
        id: item.id,
        productName: item.product.name,
        farmerName: item.product.farmerProfile.farmName || item.product.farmerProfile.user.fullName,
        quantity: item.quantity,
        pricePerUnit: Number(item.unitPrice),
        totalPrice: Number(item.subtotal),
      })),
      financials: {
        subtotal,
        taxVat,
        currency: "NGN",
        grandTotal,
      },
      seller: {
        platformName: "SmartHub AgroChain Marketplace",
        taxIdentificationNumber: "TIN-AGRO-998241",
        contactEmail: "billing@smarthubagro.com",
      },
    };

    const res = NextResponse.json(createSuccessResponse(invoiceData));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("INVOICE_GENERATION_FAILED", err.message || "Failed to generate invoice"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
