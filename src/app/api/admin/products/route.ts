import { NextResponse } from "next/server";
import { prisma, executeWithDbRetry } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");

    const whereClause: any = {};
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const products = await executeWithDbRetry(() =>
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          farmerProfile: {
            include: {
              verification: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  isActive: true,
                  createdAt: true,
                },
              },
              _count: {
                select: {
                  products: true,
                },
              },
            },
          },
          moderatedBy: {
            select: {
              fullName: true,
              email: true,
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
