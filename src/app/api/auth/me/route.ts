import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatAuthenticatedUser } from "@/lib/user-dto";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        buyerProfile: true,
        farmerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { authenticated: false, user: null, error: "User session invalid or account inactive." },
        { status: 401 }
      );
    }

    const userPayload = formatAuthenticatedUser(user);

    return NextResponse.json({
      authenticated: true,
      user: userPayload,
    });
  } catch (error) {
    console.error("Error in GET /api/auth/me:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: "Internal server error fetching session." },
      { status: 500 }
    );
  }
}
