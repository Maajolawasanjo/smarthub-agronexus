import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ message: "Logout successful." }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/auth/logout:", error);
    return NextResponse.json(
      { error: "Internal server error during logout." },
      { status: 500 }
    );
  }
}
