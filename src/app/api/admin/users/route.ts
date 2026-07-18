import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching system users API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching system users." },
      { status: 500 }
    );
  }
}
