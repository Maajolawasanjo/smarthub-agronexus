import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/user/addresses — List all saved delivery addresses for the authenticated user
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to fetch saved addresses."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const addresses = await prisma.buyerAddress.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const res = NextResponse.json(createSuccessResponse({ addresses }), { status: 200 });
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error fetching saved addresses:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve saved delivery addresses."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// POST /api/user/addresses — Add a new saved delivery address
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to save address."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const {
      label = "Delivery Address",
      recipientName,
      phoneNumber,
      addressLine,
      city = "",
      state,
      lga,
      postalCode = "",
      isDefault = false,
    } = body;

    if (!recipientName || !phoneNumber || !addressLine || !state || !lga) {
      const res = NextResponse.json(
        createErrorResponse(
          "VALIDATION_ERROR",
          "Recipient name, phone number, street address, state, and LGA are required."
        ),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // Check if user has existing addresses
    const existingCount = await prisma.buyerAddress.count({
      where: { userId: session.userId },
    });

    const shouldBeDefault = isDefault || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.buyerAddress.updateMany({
          where: { userId: session.userId },
          data: { isDefault: false },
        });
      }

      return tx.buyerAddress.create({
        data: {
          userId: session.userId,
          label: label.trim(),
          recipientName: recipientName.trim(),
          phoneNumber: phoneNumber.trim(),
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          lga: lga.trim(),
          postalCode: postalCode ? postalCode.trim() : null,
          isDefault: shouldBeDefault,
        },
      });
    });

    const res = NextResponse.json(
      createSuccessResponse({
        message: "Delivery address saved successfully.",
        address,
      }),
      { status: 201 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error creating saved address:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to save delivery address."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/user/addresses — Update saved address or set as default
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to update address."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json().catch(() => ({}));
    const { id, isDefault, label, recipientName, phoneNumber, addressLine, city, state, lga, postalCode } = body;

    if (!id) {
      const res = NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Address ID is required for update."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const existing = await prisma.buyerAddress.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Saved address not found or access denied."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.buyerAddress.updateMany({
          where: { userId: session.userId },
          data: { isDefault: false },
        });
      }

      const updateData: any = {};
      if (typeof isDefault === "boolean") updateData.isDefault = isDefault;
      if (label !== undefined) updateData.label = label.trim();
      if (recipientName !== undefined) updateData.recipientName = recipientName.trim();
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
      if (addressLine !== undefined) updateData.addressLine = addressLine.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim();
      if (lga !== undefined) updateData.lga = lga.trim();
      if (postalCode !== undefined) updateData.postalCode = postalCode ? postalCode.trim() : null;

      return tx.buyerAddress.update({
        where: { id },
        data: updateData,
      });
    });

    const res = NextResponse.json(
      createSuccessResponse({
        message: "Address updated successfully.",
        address: updated,
      }),
      { status: 200 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error updating saved address:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to update saved address."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// DELETE /api/user/addresses — Delete a saved delivery address
export async function DELETE(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session?.userId) {
      const res = NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to delete address."),
        { status: 401 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      const res = NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Address ID is required for deletion."),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const existing = await prisma.buyerAddress.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      const res = NextResponse.json(
        createErrorResponse("NOT_FOUND", "Saved address not found or access denied."),
        { status: 404 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    await prisma.$transaction(async (tx) => {
      await tx.buyerAddress.delete({
        where: { id },
      });

      // If the deleted address was default, promote the newest remaining address as default
      if (existing.isDefault) {
        const remaining = await tx.buyerAddress.findFirst({
          where: { userId: session.userId },
          orderBy: { createdAt: "desc" },
        });

        if (remaining) {
          await tx.buyerAddress.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });

    const res = NextResponse.json(
      createSuccessResponse({
        message: "Delivery address removed successfully.",
        deletedId: id,
      }),
      { status: 200 }
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (error: any) {
    console.error("Error deleting saved address:", error);
    const res = NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to delete saved address."),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
