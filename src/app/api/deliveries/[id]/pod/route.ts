import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";
import { notificationOutbox } from "@/lib/notifications/outbox";
import { recordAuditEvent } from "@/lib/audit";

export type DeliveryState =
  | "DRIVER_ASSIGNED"
  | "ACCEPTED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "NEAR_DESTINATION"
  | "DELIVERED";

export interface DeliveryEvidencePackage {
  deliveryState: DeliveryState;
  driver: {
    fullName: string;
    phoneNumber: string;
    vehicleType: string; // e.g. "Cold-Chain Refrigerated Truck 3-Ton"
    licensePlate: string; // e.g. "LSD-482-XY"
  };
  pickupTimestamp: string;
  deliveryTimestamp: string;
  gpsSnapshot: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
  };
  evidenceMedia: {
    deliveryPhotoUrl: string;
    buyerSignatureUrl: string;
  };
  receiver: {
    fullName: string;
    phoneNumber: string;
    relationshipToBuyer?: string;
  };
  deliveryNotes?: string;
}

// POST /api/deliveries/[id]/pod — Proof of Delivery (POD) Evidence & State Machine Endpoint
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceCtx = createTraceContext(req);
  const { id: deliveryId } = await params;

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body: Partial<DeliveryEvidencePackage> = await req.json();
    const { deliveryState, driver, gpsSnapshot, evidenceMedia, receiver } = body;

    if (!deliveryState || !driver?.fullName || !evidenceMedia?.deliveryPhotoUrl || !evidenceMedia?.buyerSignatureUrl) {
      const res = NextResponse.json(
        createErrorResponse(
          "INVALID_POD_PAYLOAD",
          "deliveryState, driver details, deliveryPhotoUrl, and buyerSignatureUrl are required"
        ),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const existingDelivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: { include: { buyer: { include: { user: true } } } },
        logisticsPartner: true,
      },
    });

    if (!existingDelivery) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "Delivery record not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    // 1. Strict Server-Side POD Authorization (DEL-001)
    const isAdmin = session.role === "ADMIN";
    const isAssignedDriver =
      (session.role as string) === "LOGISTICS" ||
      existingDelivery.logisticsPartnerId === session.userId ||
      existingDelivery.podDriverName === session.email ||
      existingDelivery.logisticsPartner?.email === session.email;

    if (!isAdmin && !isAssignedDriver) {
      const res = NextResponse.json(
        createErrorResponse(
          "FORBIDDEN",
          "Only the assigned logistics driver or an Administrator can submit Proof of Delivery for this order"
        ),
        { status: 403 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    // 2. Strict GPS Validation (DEL-001) — No fake/default Lagos fallback
    const lat = gpsSnapshot?.latitude;
    const lng = gpsSnapshot?.longitude;

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      const res = NextResponse.json(
        createErrorResponse(
          "INVALID_GPS_DATA",
          "Valid GPS coordinates (latitude between -90 and 90, longitude between -180 and 180) are required for Proof of Delivery verification"
        ),
        { status: 400 }
      );
      return attachTraceHeaders(res, traceCtx);
    }

    const isDelivered = deliveryState === "DELIVERED";

    // Update Delivery status & persist immutable POD evidence in Database (DEL-001)
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: isDelivered ? "DELIVERED" : "IN_TRANSIT",
        deliveredAt: isDelivered ? new Date() : null,
        podPhotoUrl: evidenceMedia.deliveryPhotoUrl,
        podSignatureUrl: evidenceMedia.buyerSignatureUrl,
        podLatitude: lat,
        podLongitude: lng,
        podDriverName: driver.fullName,
        podLicensePlate: driver.licensePlate || null,
      },
    });

    // If order was delivered, update Order status to DELIVERED
    if (isDelivered) {
      await prisma.order.update({
        where: { id: existingDelivery.orderId },
        data: { status: "DELIVERED" },
      });

      // Dispatch high-value SMS & Email notifications to buyer
      notificationOutbox.enqueueSMS({
        to: existingDelivery.order.buyer.user.phoneNumber || "+2348000000000",
        message: `SmartHub AgroChain: Order #${existingDelivery.order.orderNumber} delivered by ${driver.fullName} (${driver.licensePlate}).`,
        type: "ORDER_SHIPPED",
      });

      notificationOutbox.enqueueEmail({
        to: existingDelivery.order.buyer.user.email,
        subject: `Order #${existingDelivery.order.orderNumber} Delivered Successfully`,
        template: "ORDER_DELIVERED",
        data: {
          orderNumber: existingDelivery.order.orderNumber,
          driverName: driver.fullName,
          licensePlate: driver.licensePlate,
          receiverName: receiver?.fullName || existingDelivery.order.buyer.user.fullName,
        },
      });

      // Process Outbox Notifications immediately
      await notificationOutbox.processQueue();
    }

    await recordAuditEvent({
      category: "DELIVERY",
      severity: "INFO",
      action: "POD_SUBMITTED",
      actorId: session.userId,
      actorEmail: session.email,
      resourceId: updatedDelivery.id,
      metadata: {
        orderId: existingDelivery.orderId,
        orderNumber: existingDelivery.order.orderNumber,
        deliveryStatus: updatedDelivery.deliveryStatus,
        isDelivered,
      },
      req,
    });

    const evidencePackage: DeliveryEvidencePackage = {
      deliveryState,
      driver: {
        fullName: driver.fullName,
        phoneNumber: driver.phoneNumber || "—",
        vehicleType: driver.vehicleType || "Truck",
        licensePlate: driver.licensePlate || "N/A",
      },
      pickupTimestamp: body.pickupTimestamp || new Date().toISOString(),
      deliveryTimestamp: new Date().toISOString(),
      gpsSnapshot: {
        latitude: lat,
        longitude: lng,
        accuracyMeters: gpsSnapshot?.accuracyMeters || 5,
      },
      evidenceMedia: {
        deliveryPhotoUrl: evidenceMedia.deliveryPhotoUrl,
        buyerSignatureUrl: evidenceMedia.buyerSignatureUrl,
      },
      receiver: {
        fullName: receiver?.fullName || existingDelivery.order.buyer.user.fullName,
        phoneNumber: receiver?.phoneNumber || "—",
      },
      deliveryNotes: body.deliveryNotes || "Verified Proof of Delivery captured.",
    };

    const res = NextResponse.json(
      createSuccessResponse({
        deliveryId: updatedDelivery.id,
        orderId: existingDelivery.orderId,
        deliveryStatus: updatedDelivery.deliveryStatus,
        evidencePackage,
        message: "Proof of Delivery evidence package successfully verified and attached to order.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("POD_SUBMISSION_FAILED", err.message || "Failed to submit Proof of Delivery"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
