import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  revokeRealmSession,
  clearSessionCookie,
  AuthRealm,
  REALM_COOKIE_NAMES,
} from "@/lib/session";

export async function POST(req: Request) {
  try {
    const realmHeader = req.headers.get("x-auth-realm")?.toUpperCase();
    const referer = req.headers.get("referer") || "";
    const body = await req.json().catch(() => null);
    const requestedRealm = body?.realm || realmHeader;

    let targetRealm: AuthRealm | null = null;
    if (
      requestedRealm &&
      (requestedRealm === "ADMIN" || requestedRealm === "FARMER" || requestedRealm === "BUYER")
    ) {
      targetRealm = requestedRealm as AuthRealm;
    } else if (referer.includes("/admin")) {
      targetRealm = AuthRealm.ADMIN;
    } else if (referer.includes("/farmer")) {
      targetRealm = AuthRealm.FARMER;
    } else if (referer.includes("/dashboard")) {
      targetRealm = AuthRealm.BUYER;
    }

    const cookieStore = await cookies();

    if (targetRealm) {
      await revokeRealmSession(targetRealm);
    } else {
      // If unspecified, check which single realm cookie is present
      for (const realm of [AuthRealm.ADMIN, AuthRealm.FARMER, AuthRealm.BUYER]) {
        if (cookieStore.get(REALM_COOKIE_NAMES[realm])?.value) {
          await revokeRealmSession(realm);
          targetRealm = realm;
          break;
        }
      }
    }

    // Clear legacy cookie
    await clearSessionCookie();

    return NextResponse.json(
      {
        message: "Logout successful.",
        revokedRealm: targetRealm,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth/logout:", error);
    return NextResponse.json(
      { error: "Internal server error during logout." },
      { status: 500 }
    );
  }
}
