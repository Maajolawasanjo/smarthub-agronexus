import { NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// POST /api/shipping/calculate — Dynamic shipping fee calculation engine
export async function POST(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const body = await req.json();
    const { destinationState, weightKg, deliverySpeed = "STANDARD" } = body;

    const weight = parseFloat(weightKg) || 1.0;

    // Base rate calculation
    let baseRate = 1500; // Flat base fee ₦1,500 for local state delivery

    if (destinationState && destinationState.toLowerCase() !== "lagos") {
      baseRate = 3500; // Inter-state regional delivery rate
    }

    // Weight tier surcharge (₦100 per additional kg above 5kg)
    const extraWeight = Math.max(0, weight - 5);
    const weightSurcharge = extraWeight * 100;

    // Express multiplier
    const speedMultiplier = deliverySpeed.toUpperCase() === "EXPRESS" ? 1.5 : 1.0;

    const totalShippingFee = Math.round((baseRate + weightSurcharge) * speedMultiplier);
    const estimatedDays = deliverySpeed.toUpperCase() === "EXPRESS" ? "1-2 Business Days" : "3-5 Business Days";

    const res = NextResponse.json(
      createSuccessResponse({
        destinationState: destinationState || "Local",
        weightKg: weight,
        deliverySpeed,
        baseRate,
        weightSurcharge,
        totalShippingFee,
        estimatedDeliveryTime: estimatedDays,
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(createErrorResponse("CALCULATION_FAILED", err.message || "Failed to calculate shipping fee"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}
