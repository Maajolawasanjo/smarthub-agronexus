import { isTrustedMutationOrigin } from "@/lib/csrf";
import { OrderStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";
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

    if (!isTrustedMutationOrigin(req)) {
      return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
    }

    if (session.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyer accounts can place marketplace orders." }, { status: 403 });
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

    const requestedPaymentMethod =
      typeof paymentMethod === "string" && paymentMethod.trim()
        ? paymentMethod.trim().toUpperCase()
        : "WALLET";
    if (requestedPaymentMethod !== "CARD" && requestedPaymentMethod !== "WALLET") {
      return NextResponse.json(
        { error: "Unsupported checkout payment method. Use CARD or WALLET." },
        { status: 400 }
      );
    }
    const validPaymentMethod = requestedPaymentMethod === "CARD" ? "CARD" : "WALLET";

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

        if (!product || product.status !== "APPROVED" || !product.isAvailable) {
          throw new Error(
            `Product "${item.productId}" is not approved and available for purchase.`
          );
        }

        const requestedQty = Number.parseInt(item.quantity?.toString() || "1", 10);
        if (!Number.isSafeInteger(requestedQty) || requestedQty <= 0) {
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
        if (
          !Number.isFinite(unitPrice) ||
          unitPrice <= 0 ||
          !Number.isFinite(subtotal) ||
          subtotal <= 0
        ) {
          throw new Error(`Invalid product price for "${product.name}".`);
        }
        totalAmount += subtotal;
        if (!Number.isFinite(totalAmount) || totalAmount > 99_999_999.99) {
          throw new Error("ORDER_AMOUNT_LIMIT_EXCEEDED: The order total exceeds the supported NGN limit.");
        }

        orderItemsData.push({
          productId: product.id,
          quantity: requestedQty,
          unitPrice,
          subtotal,
        });

        // 2. Atomically reserve inventory with conditional check against race conditions (INV-001)
        const updatedRows = await tx.$executeRaw`
          UPDATE "Inventory"
          SET "availableQty" = "availableQty" - ${requestedQty},
              "reservedQty"  = "reservedQty"  + ${requestedQty},
              "updatedAt"    = NOW()
          WHERE "productId"  = ${product.id}
            AND "availableQty" >= ${requestedQty}
        `;

        if (Number(updatedRows) !== 1) {
          throw new Error(
            `INSUFFICIENT_STOCK: Concurrent reservation failed for "${product.name}". Requested: ${requestedQty}. Stock was modified by another checkout.`
          );
        }
      }

      // Generate a stable server-side order reference before locking funds. The payment
      // record and wallet escrow-lock ledger entry must share this reference.
      const orderNumber = `AGRO-${Date.now().toString().slice(-6)}-${Math.floor(
        100 + Math.random() * 900
      )}`;
      const paymentReference = `REF-${orderNumber}`;

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
            `Insufficient wallet balance. Order Total: ₦${totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Available Balance: ₦${currentBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}. Please top up your wallet or proceed to payment.`
          );
        }

        // The prior balance read is advisory only. The conditional debit is the
        // authoritative guard against two concurrent checkouts spending the same funds.
        const walletDebit = await tx.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: totalAmount } },
          data: {
            balance: { decrement: totalAmount },
            escrow: { increment: totalAmount },
          },
        });
        if (walletDebit.count !== 1) {
          throw new Error("INSUFFICIENT_FUNDS: Wallet balance changed before checkout could reserve escrow.");
        }

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "ESCROW_LOCK",
            amount: totalAmount,
            reference: paymentReference,
            description: `Escrow locked for Order checkout`,
            status: "SUCCESS",
          },
        });
      }

      // 4. Create Order + OrderItems + Payment + Delivery atomically
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: buyerProfile.id,
          shippingAddressId: body.shippingAddressId || null,
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
              financialState: validPaymentMethod === "WALLET" ? "ESCROWED" : "PENDING",
              transactionRef: paymentReference,
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
              product: { select: { id: true, name: true, farmerProfileId: true } },
            },
          },
          payment: true,
          delivery: true,
        },
      });

      // 5. Multi-Vendor Sub-Orders: Partition OrderItems by Farmer into SellerOrders
      const farmerItemsMap = new Map<string, string[]>();
      for (const oi of createdOrder.orderItems) {
        const fId = oi.product.farmerProfileId;
        if (!farmerItemsMap.has(fId)) {
          farmerItemsMap.set(fId, []);
        }
        farmerItemsMap.get(fId)!.push(oi.id);
      }

      let sellerIndex = 1;
      for (const [farmerId, oiIds] of farmerItemsMap.entries()) {
        const subtotalForFarmer = createdOrder.orderItems
          .filter((oi) => oiIds.includes(oi.id))
          .reduce((sum, oi) => sum + Number(oi.subtotal), 0);

        const sellerOrderNumber = `${orderNumber}-S${sellerIndex}`;
        sellerIndex++;

        const sellerOrder = await tx.sellerOrder.create({
          data: {
            sellerOrderNumber,
            orderId: createdOrder.id,
            farmerProfileId: farmerId,
            subtotal: subtotalForFarmer,
            totalAmount: subtotalForFarmer,
            status: "PENDING",
          },
        });

        // Link OrderItems to their discrete SellerOrder
        await tx.orderItem.updateMany({
          where: { id: { in: oiIds } },
          data: { sellerOrderId: sellerOrder.id },
        });
      }

      return createdOrder;
    });

    await recordAuditEvent({
      category: "ORDER",
      severity: "INFO",
      action: "ORDER_CREATED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceId: newOrder.id,
      metadata: {
        orderNumber: newOrder.orderNumber,
        totalAmount: Number(newOrder.totalAmount),
        itemCount: newOrder.orderItems.length,
      },
      req,
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
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[ORDERS_CREATE_ERROR] Full Details:", error);

    // Handle known validation errors
    if (
      err.message?.includes("Insufficient stock") ||
      err.message?.includes("INSUFFICIENT_STOCK") ||
      err.message?.includes("not available") ||
      err.message?.includes("not approved and available") ||
      err.message?.includes("Invalid quantity") ||
      err.message?.includes("Invalid product price") ||
      err.message?.includes("ORDER_AMOUNT_LIMIT_EXCEEDED") ||
      err.message?.includes("Insufficient wallet balance") ||
      err.message?.includes("INSUFFICIENT_FUNDS")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Internal server error creating order.",
        details: process.env.NODE_ENV !== "production" ? (err?.message || String(error)) : undefined
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
    const whereClause: Prisma.OrderWhereInput = {};

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
      whereClause.status = statusFilter.toUpperCase() as OrderStatus;
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
        where: whereClause,
        _count: { _all: true },
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
      const count = typeof sc._count === "object" && sc._count ? (sc._count as { _all?: number })._all ?? 0 : Number(sc._count || 0);
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
      where: whereClause,
      _sum: { totalAmount: true },
    });
    const totalSpent = Number(totalSpentResult._sum?.totalAmount || 0);
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
  } catch (error: unknown) {
    console.error("Error fetching OrdersPageDTO:", error);
    return NextResponse.json(
      { error: "Internal server error fetching orders." },
      { status: 500 }
    );
  }
}
