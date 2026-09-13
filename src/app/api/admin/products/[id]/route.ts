import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { PUT as approvePUT, DELETE as approveDELETE } from "./approve/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminSession();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        createErrorResponse("FORBIDDEN", "Admin authorization required."),
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        createErrorResponse("BAD_REQUEST", "Product ID is required."),
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        inventory: true,
        farmerProfile: {
          include: {
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
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Produce listing not found."),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse({ product }), { status: 200 });
  } catch (error: any) {
    console.error("Error fetching single admin product:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch product details."),
      { status: 500 }
    );
  }
}

export const PUT = approvePUT;
export const PATCH = approvePUT;
export const DELETE = approveDELETE;
