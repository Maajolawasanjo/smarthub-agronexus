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
    const { action, isApproved, rejectionReason, reason } = body;

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

    // Determine target status and availability based on action or legacy isApproved
    let targetStatus: "APPROVED" | "REJECTED" | "SUSPENDED" = "APPROVED";
    let targetAvailable = true;
    let auditAction = "PRODUCT_APPROVED";
    let statusMessage = "Produce approved and published to showroom.";
    let notificationTitle = `Produce Approved: ${existingProduct.name}`;
    let notificationMsg = `Your commodity listing "${existingProduct.name}" has been approved and is now live on the public marketplace.`;

    if (action === "SUSPEND") {
      targetStatus = "SUSPENDED";
      targetAvailable = false;
      auditAction = "PRODUCT_SUSPENDED";
      statusMessage = "Produce listing suspended and withdrawn from showroom.";
      notificationTitle = `Produce Listing Suspended: ${existingProduct.name}`;
      notificationMsg = `Your commodity listing "${existingProduct.name}" has been suspended by administration. Reason: ${reason || rejectionReason || "Listing under administrative review."}`;
    } else if (action === "REINSTATE") {
      targetStatus = "APPROVED";
      targetAvailable = true;
      auditAction = "PRODUCT_REINSTATED";
      statusMessage = "Produce listing reinstated and restored to showroom.";
      notificationTitle = `Produce Listing Reinstated: ${existingProduct.name}`;
      notificationMsg = `Your commodity listing "${existingProduct.name}" has been reinstated and is active on the public marketplace.`;
    } else if (action === "REJECT" || (action === undefined && isApproved === false)) {
      targetStatus = "REJECTED";
      targetAvailable = false;
      auditAction = "PRODUCT_REJECTED";
      statusMessage = "Produce listing rejected.";
      notificationTitle = `Produce Rejected: ${existingProduct.name}`;
      notificationMsg = `Your commodity listing "${existingProduct.name}" was rejected. Reason: ${rejectionReason || reason || "Produce listing did not meet marketplace quality standards."}`;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        status: targetStatus,
        isAvailable: targetAvailable,
        rejectionReason: targetStatus === "APPROVED" ? null : (rejectionReason || reason || (targetStatus === "SUSPENDED" ? "Listing suspended by admin." : "Produce listing did not meet marketplace quality standards.")),
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
      severity: targetStatus === "SUSPENDED" ? "WARNING" : "INFO",
      action: auditAction,
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "PRODUCT",
      resourceId: id,
      metadata: {
        productName: existingProduct.name,
        farmerProfileId: existingProduct.farmerProfileId,
        targetStatus,
        rejectionReason: rejectionReason || reason || null,
      },
      req,
    });

    // Notify farmer via in-app persistent notification
    if (existingProduct.farmerProfile?.userId) {
      await createNotification({
        userId: existingProduct.farmerProfile.userId,
        title: notificationTitle,
        message: notificationMsg,
        type: "SYSTEM",
      });
    }

    return NextResponse.json(
      createSuccessResponse({
        message: statusMessage,
        product: updatedProduct,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving/moderating product API:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Internal server error moderating produce."),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== "ADMIN") {
      return NextResponse.json(
        createErrorResponse("FORBIDDEN", "Administrative privileges required to delete produce listings."),
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Product ID is required."),
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: { select: { id: true } },
        farmerProfile: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Produce listing not found."),
        { status: 404 }
      );
    }

    // Safe deletion check: If orderItems exist, archive instead of hard delete to preserve financial ledger
    const hasOrders = existingProduct.orderItems.length > 0;

    if (hasOrders) {
      const archivedProduct = await prisma.product.update({
        where: { id },
        data: {
          status: "ARCHIVED",
          isAvailable: false,
          moderatedAt: new Date(),
          moderatedById: session.userId,
        },
      });

      await recordAuditEvent({
        category: "SYSTEM",
        severity: "WARNING",
        action: "PRODUCT_ARCHIVED",
        actorId: session.userId,
        actorEmail: session.email,
        resourceType: "PRODUCT",
        resourceId: id,
        metadata: {
          productName: existingProduct.name,
          farmerProfileId: existingProduct.farmerProfileId,
          orderCount: existingProduct.orderItems.length,
          note: "Soft-deleted to ARCHIVED status due to existing order history.",
        },
        req,
      });

      return NextResponse.json(
        createSuccessResponse({
          message: "Produce listing archived successfully (retained in ledger for order history).",
          product: archivedProduct,
          archived: true,
        }),
        { status: 200 }
      );
    }

    // Hard delete when zero orders exist
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.inventory.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    await recordAuditEvent({
      category: "SYSTEM",
      severity: "INFO",
      action: "PRODUCT_DELETED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceType: "PRODUCT",
      resourceId: id,
      metadata: {
        productName: existingProduct.name,
        farmerProfileId: existingProduct.farmerProfileId,
        note: "Permanently deleted listing with zero order history.",
      },
      req,
    });

    return NextResponse.json(
      createSuccessResponse({
        message: "Produce listing permanently deleted.",
        deleted: true,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting product API:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Internal server error deleting produce listing."),
      { status: 500 }
    );
  }
}

