import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recordAuditEvent } from "@/lib/audit";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        createErrorResponse("UNAUTHORIZED", "Authentication required to moderate produce."),
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        createErrorResponse("FORBIDDEN", "Administrative privileges required to moderate produce listings."),
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { isApproved = true, rejectionReason } = body;

    if (!id) {
      return NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Product ID is required."),
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { farmerProfile: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Produce listing not found."),
        { status: 404 }
      );
    }

    const isApprovedBool = Boolean(isApproved);
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        status: isApprovedBool ? "APPROVED" : "REJECTED",
        isAvailable: isApprovedBool,
        rejectionReason: isApprovedBool
          ? null
          : rejectionReason || "Produce listing did not meet marketplace quality standards.",
        moderatedAt: new Date(),
        moderatedById: session.userId,
      },
      include: {
        category: true,
        farmerProfile: true,
        moderatedBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    // Record audit event for compliance
    await recordAuditEvent({
      category: "SYSTEM",
      severity: "INFO",
      action: isApproved ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "PRODUCT",
      resourceId: id,
      metadata: {
        productName: existingProduct.name,
        farmerProfileId: existingProduct.farmerProfileId,
        rejectionReason: rejectionReason || null,
      },
      req,
    });

    // Notify farmer via in-app persistent notification
    if (existingProduct.farmerProfile?.userId) {
      await createNotification({
        userId: existingProduct.farmerProfile.userId,
        title: isApprovedBool
          ? `Produce Approved: ${existingProduct.name}`
          : `Produce Rejected: ${existingProduct.name}`,
        message: isApprovedBool
          ? `Your commodity listing "${existingProduct.name}" has been approved and is now live on the public marketplace.`
          : `Your commodity listing "${existingProduct.name}" was rejected. Reason: ${rejectionReason || "Produce listing did not meet marketplace quality standards."}`,
        type: "SYSTEM",
      });
    }

    return NextResponse.json(
      createSuccessResponse({
        message: isApproved
          ? "Produce approved and published to showroom."
          : "Produce listing rejected.",
        product: updatedProduct,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving product API:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Internal server error moderating produce."),
      { status: 500 }
    );
  }
}

