import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        farmerProfile: true,
        images: true,
        inventory: true,
        reviews: {
          include: {
            buyer: {
              include: {
                user: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching product detail API:", error);
    return NextResponse.json(
      { error: "Internal server error fetching product." },
      { status: 500 }
    );
  }
}
