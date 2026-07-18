import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { isApproved = true } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isAvailable: isApproved,
      },
      include: {
        category: true,
        farmerProfile: true,
      },
    });

    return NextResponse.json(
      {
        message: isApproved
          ? "Produce approved and published to showroom."
          : "Produce listing rejected.",
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving product API:", error);
    return NextResponse.json(
      { error: "Internal server error approving product." },
      { status: 500 }
    );
  }
}
