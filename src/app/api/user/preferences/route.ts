import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCountryMetadata } from "@/lib/i18n/countries";
import { CurrencyCode } from "@/lib/i18n/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.userId },
    });

    if (!preferences) {
      // Default preferences
      return NextResponse.json({
        success: true,
        preferences: {
          countryCode: "NG",
          regionCode: "LA",
          currencyCode: "NGN",
          timezone: "Africa/Lagos",
          locale: "en-NG",
          isCustomCurrency: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user preferences", success: false },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { countryCode, regionCode, currencyCode, timezone, locale, isCustomCurrency } = body;

    const countryMeta = getCountryMetadata(countryCode || "NG");
    const targetCurrency = currencyCode || countryMeta.defaultCurrency;
    const targetTimezone = timezone || countryMeta.defaultTimezone;
    const targetLocale = locale || countryMeta.defaultLocale;
    const targetRegion = regionCode || (countryMeta.regions[0]?.code ?? "");

    const updated = await prisma.userPreferences.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        countryCode: countryMeta.code,
        regionCode: targetRegion,
        currencyCode: targetCurrency as CurrencyCode,
        timezone: targetTimezone,
        locale: targetLocale,
        isCustomCurrency: Boolean(isCustomCurrency),
      },
      update: {
        countryCode: countryMeta.code,
        regionCode: targetRegion,
        currencyCode: targetCurrency as CurrencyCode,
        timezone: targetTimezone,
        locale: targetLocale,
        isCustomCurrency: Boolean(isCustomCurrency),
      },
    });

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update user preferences", success: false },
      { status: 500 }
    );
  }
}
