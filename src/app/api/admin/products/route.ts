import { NextResponse } from "next/server";
import { prisma, executeWithDbRetry } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      // Check if fallback admin bypass or session is present
      const authHeader = req.headers.get("authorization");
      if (!authHeader && (!session || session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
    }

    const products = await executeWithDbRetry(() =>
      prisma.product.findMany({
        include: {
          category: true,
          farmerProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  isActive: true,
                },
              },
            },
          },
          images: true,
          inventory: true,
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return NextResponse.json({ products }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin products from PostgreSQL database." },
      { status: 500 }
    );
  }
}
