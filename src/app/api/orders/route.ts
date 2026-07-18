import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      buyerProfileId,
      items, // Array of { productId, quantity, unitPrice }
      shippingAddress,
      destinationPort,
      incoterm = "FOB",
      paymentMethod = "ESCROW",
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one produce item." },
        { status: 400 }
      );
    }

    // 1. Find or fallback buyer profile
    let buyerProfile = buyerProfileId
      ? await prisma.buyerProfile.findUnique({ where: { id: buyerProfileId } })
      : await prisma.buyerProfile.findFirst();

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "Valid buyer profile is required to place an order." },
        { status: 404 }
      );
    }

    // 2. Calculate total amount
    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const itemTotal = parseFloat(item.unitPrice.toString()) * parseInt(item.quantity.toString());
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        quantity: parseInt(item.quantity.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        totalPrice: itemTotal,
      };
    });

    // 3. Generate unique order number
    const orderNumber = `AGRO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Create Order with items & escrow transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: buyerProfile.id,
          totalAmount,
          status: "PENDING",
          deliveryAddress: destinationPort ? `${shippingAddress} (Port: ${destinationPort}, Incoterm: ${incoterm})` : shippingAddress,
          items: {
            create: orderItemsData,
          },
          payments: {
            create: [
              {
                amount: totalAmount,
                paymentMethod: paymentMethod.toUpperCase(),
                status: "PENDING",
                transactionRef: `REF-${orderNumber}`,
              },
            ],
          },
          delivery: {
            create: {
              trackingNumber: `TRK-${orderNumber}`,
              status: "PENDING",
              carrier: "Maersk Agro Logistics",
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
          delivery: true,
        },
      });

      return createdOrder;
    });

    return NextResponse.json(
      {
        message: "Order placed successfully. Escrow hold initialized.",
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order API:", error);
    return NextResponse.json(
      { error: "Internal server error creating order." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerProfileId = searchParams.get("buyerProfileId");

    const whereClause = buyerProfileId ? { buyerId: buyerProfileId } : {};

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        buyer: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        delivery: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching orders API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching orders." },
      { status: 500 }
    );
  }
}
