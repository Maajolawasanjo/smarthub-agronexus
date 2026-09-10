import { NextResponse } from "next/server";
import { STATIC_FALLBACK_RATES } from "@/lib/i18n/fx";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      base: "NGN",
      timestamp: Date.now(),
      rates: STATIC_FALLBACK_RATES,
      isFallback: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      base: "NGN",
      timestamp: Date.now(),
      rates: STATIC_FALLBACK_RATES,
      isFallback: true,
      error: error?.message || "Failed to load exchange rates",
    });
  }
}
