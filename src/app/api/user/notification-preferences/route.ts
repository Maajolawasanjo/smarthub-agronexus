import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

export interface UserNotificationPreferences {
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  categories: {
    orders: boolean;
    wallet: boolean;
    security: boolean;
    system: boolean;
    marketing: boolean;
  };
  updatedAt: string;
}

// Baseline in-memory storage per user
const preferencesStore = new Map<string, UserNotificationPreferences>();

const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  channels: {
    email: true,
    sms: true,
    push: true,
    inApp: true,
  },
  categories: {
    orders: true,
    wallet: true,
    security: true,
    system: true,
    marketing: false,
  },
  updatedAt: new Date().toISOString(),
};

// GET /api/user/notification-preferences — Retrieve user notification settings
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const current = preferencesStore.get(session.userId) || { ...DEFAULT_PREFERENCES };

    const res = NextResponse.json(createSuccessResponse(current));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("PREFERENCES_FETCH_FAILED", err.message || "Failed to fetch notification preferences"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/user/notification-preferences — Update user notification settings
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);

  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();
    const existing = preferencesStore.get(session.userId) || { ...DEFAULT_PREFERENCES };

    const updated: UserNotificationPreferences = {
      channels: {
        ...existing.channels,
        ...(body.channels || {}),
      },
      categories: {
        ...existing.categories,
        ...(body.categories || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    preferencesStore.set(session.userId, updated);

    const res = NextResponse.json(
      createSuccessResponse({
        preferences: updated,
        message: "Your notification preferences have been saved.",
      })
    );
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    const res = NextResponse.json(
      createErrorResponse("PREFERENCES_UPDATE_FAILED", err.message || "Failed to update notification preferences"),
      { status: 500 }
    );
    return attachTraceHeaders(res, traceCtx);
  }
}
