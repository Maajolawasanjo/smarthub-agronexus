import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  OrdersPageDTO,
  OrderSummaryItemDTO,
} from "@/dto";

// ────────────────────────────────────────────────────────────
// POST /api/orders — Production Transactional Checkout
// ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to place an order." },
        { status: 401 }
      );
    }

    // Find buyer profile from authenticated user
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "A buyer profile is required to place an order." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      items, // Array of { productId, quantity }
      shippingAddress = "Standard Delivery Address",
      destinationPort,
      incoterm = "FOB",
      paymentMethod = "WALLET",
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    const validPaymentMethod =
      paymentMethod.toUpperCase() === "BANK_TRANSFER"
        ? "BANK_TRANSFER"
        : paymentMethod.toUpperCase() === "CARD"
        ? "CARD"
        : "WALLET";

    const fullDeliveryAddress = destinationPort
      ? `${shippingAddress} (Port: ${destinationPort}, Incoterm: ${incoterm})`
      : shippingAddress;

    // Execute entire checkout inside a single transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      // 1. Validate each item: fetch product, check availability, reserve inventory
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!product || !product.isAvailable) {
          throw new Error(
            `Product "${item.productId}" is not available for purchase.`
          );
        }

        const requestedQty = parseInt(item.quantity?.toString() || "1", 10);
        if (requestedQty <= 0) {
          throw new Error(`Invalid quantity for product "${product.name}".`);
        }

        const availableQty = product.inventory?.availableQty ?? 0;
        if (availableQty < requestedQty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Requested: ${requestedQty}, Available: ${availableQty}.`
          );
        }

        // Server-side price (NEVER trust client price)
        const unitPrice = Number(product.price);
        const subtotal = unitPrice * requestedQty;
        totalAmount += subtotal;

        orderItemsData.push({
          productId: product.id,
          quantity: requestedQty,
          unitPrice,
          subtotal,
        });

        // 2. Atomically reserve inventory
        await tx.inventory.update({
          where: { productId: product.id },
          data: {
            availableQty: { decrement: requestedQty },
            reservedQty: { increment: requestedQty },
          },
        });
      }

      // 3. If paying with WALLET, check balance & debit atomically inside transaction
      if (validPaymentMethod === "WALLET") {
        let wallet = await tx.wallet.findUnique({
          where: { userId: session.userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: session.userId, balance: 0.0, escrow: 0.0 },
          });
        }

        const currentBalance = Number(wallet.balance);
        if (currentBalance < totalAmount) {
          throw new Error(
            `Insufficient wallet balance. Order Total: ₦${totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Available Balance: ₦${currentBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}. Please top up your wallet or use Credit Card / Flutterwave.`
          );
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: totalAmount },
            escrow: { increment: totalAmount },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "ESCROW_LOCK",
            amount: totalAmount,
            reference: `REF-${Date.now()}`,
            description: `Escrow locked for Order checkout`,
            status: "SUCCESS",
          },
        });
      }

      // 4. Generate unique order number
      const orderNumber = `AGRO-${Date.now().toString().slice(-6)}-${Math.floor(
        100 + Math.random() * 900
      )}`;

      // 4. Create Order + OrderItems + Payment + Delivery atomically
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: buyerProfile.id,
          totalAmount,
          status: "PENDING",
          orderItems: {
            create: orderItemsData,
          },
          payment: {
            create: {
              amount: totalAmount,
              paymentMethod: validPaymentMethod,
              paymentStatus: validPaymentMethod === "WALLET" ? "PAID" : "PENDING",
              transactionRef: `REF-${orderNumber}`,
            },
          },
          delivery: {
            create: {
              trackingNumber: `TRK-${orderNumber}`,
              deliveryStatus: "PENDING",
              deliveryAddress: fullDeliveryAddress,
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: { select: { name: true } },
            },
          },
          payment: true,
          delivery: true,
        },
      });

      return createdOrder;
    });

    return NextResponse.json(
      {
        message: "Order placed successfully. Inventory reserved. Escrow hold initialized.",
        order: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          totalAmount: Number(newOrder.totalAmount),
          status: newOrder.status,
          itemCount: newOrder.orderItems.length,
          createdAt: newOrder.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[ORDERS_CREATE_ERROR] Full Details:", error);

    // Handle known validation errors
    if (
      error.message?.includes("Insufficient stock") ||
      error.message?.includes("not available") ||
      error.message?.includes("Invalid quantity") ||
      error.message?.includes("Insufficient wallet balance")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Internal server error creating order.",
        details: process.env.NODE_ENV !== "production" ? (error?.message || String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────
// GET /api/orders — OrdersPageDTO with Role-Based Filtering
// ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const whereClause: any = {};

    if (session.role === "BUYER") {
      const buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!buyerProfile) {
        return NextResponse.json(
          { error: "Buyer profile not found." },
          { status: 404 }
        );
      }
      whereClause.buyerId = buyerProfile.id;
    } else if (session.role === "FARMER") {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!farmerProfile) {
        return NextResponse.json(
          { error: "Farmer profile not found." },
          { status: 404 }
        );
      }
      whereClause.orderItems = {
        some: {
          product: { farmerProfileId: farmerProfile.id },
        },
      };
    }
    // ADMIN: no filter — sees all orders

    if (statusFilter && statusFilter.toUpperCase() !== "ALL") {
      whereClause.status = statusFilter.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { buyer: { user: { fullName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    // Parallel queries for efficiency
    const [total, ordersRaw, statusCounts] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          buyer: {
            include: { user: { select: { fullName: true } } },
          },
          orderItems: {
            include: {
              product: {
                include: { images: { take: 1 } },
              },
            },
          },
          payment: true,
          delivery: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      // Aggregate status counts
      prisma.order.groupBy({
        by: ["status"],
        where: session.role === "BUYER"
          ? { buyerId: whereClause.buyerId }
          : session.role === "FARMER"
          ? { orderItems: { some: { product: { farmerProfileId: whereClause.orderItems?.some?.product?.farmerProfileId } } } }
          : {},
        _count: { id: true },
      }),
    ]);

    // Build status summary
    const statusSummary = {
      all: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      readyForPickup: 0,
      inTransit: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const sc of statusCounts) {
      const count = sc._count.id;
      statusSummary.all += count;
      switch (sc.status) {
        case "PENDING": statusSummary.pending = count; break;
        case "CONFIRMED": statusSummary.confirmed = count; break;
        case "PROCESSING": statusSummary.processing = count; break;
        case "READY_FOR_PICKUP": statusSummary.readyForPickup = count; break;
        case "IN_TRANSIT": statusSummary.inTransit = count; break;
        case "DELIVERED": statusSummary.delivered = count; break;
        case "COMPLETED": statusSummary.completed = count; break;
        case "CANCELLED": statusSummary.cancelled = count; break;
      }
    }

    // Calculate statistics
    const totalSpentResult = await prisma.order.aggregate({
      where: session.role === "BUYER" ? { buyerId: whereClause.buyerId } : {},
      _sum: { totalAmount: true },
    });
    const totalSpent = Number(totalSpentResult._sum.totalAmount || 0);
    const totalOrders = statusSummary.all;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Format orders
    const orders: OrderSummaryItemDTO[] = ordersRaw.map((o) => {
      const primaryItem = o.orderItems[0];
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        itemCount: o.orderItems.length,
        primaryProductName: primaryItem?.product?.name || "Unknown Product",
        primaryProductImage:
          primaryItem?.product?.images?.[0]?.imageUrl || "/images/products/sesame_seeds.png",
        buyerName: o.buyer?.user?.fullName || "Unknown Buyer",
        paymentStatus: o.payment?.paymentStatus || "PENDING",
        deliveryStatus: o.delivery?.deliveryStatus || "PENDING",
        createdAt: o.createdAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    const dto: OrdersPageDTO = {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      statusSummary,
      statistics: {
        totalSpent,
        totalOrders,
        avgOrderValue,
      },
    };

    return NextResponse.json(dto, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching OrdersPageDTO:", error);
    return NextResponse.json(
      { error: "Internal server error fetching orders." },
      { status: 500 }
    );
  }
}
