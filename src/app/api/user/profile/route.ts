import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// GET /api/user/profile — Fetch current user profile with role-specific data
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required to view user profile"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        buyerProfile: true,
        farmerProfile: true,
      },
    });

    if (!user) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "User profile not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const userWithoutPassword = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      buyerProfile: user.buyerProfile,
      farmerProfile: user.farmerProfile,
    };

    const res = NextResponse.json(createSuccessResponse(userWithoutPassword));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch user profile";
    console.error("Error in GET /api/user/profile:", err);
    const res = NextResponse.json(createErrorResponse("FETCH_FAILED", message), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/user/profile — Persist profile updates to PostgreSQL
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const session = await getSession();
    if (!session) {
      const res = NextResponse.json(createErrorResponse("UNAUTHORIZED", "Authentication required to update user profile"), { status: 401 });
      return attachTraceHeaders(res, traceCtx);
    }

    const body = await req.json();

    const {
      fullName,
      email: bodyEmail,
      phoneNumber,
      address,
      state,
      lga,
      farmName,
      farmDescription,
      farmAddress,
      profileImage,
    } = body;

    // 1. Locate target authenticated user
    const targetUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { buyerProfile: true, farmerProfile: true },
    });

    if (!targetUser) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "User profile not found"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const targetId = targetUser.id;

    // 2. Update User base fields
    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(fullName && { fullName }),
        ...(bodyEmail && { email: bodyEmail }),
        ...(phoneNumber && { phoneNumber }),
        ...(profileImage !== undefined && { profileImage }),
      },
      include: { buyerProfile: true, farmerProfile: true },
    });

    // 3. Update or create Buyer Profile
    if (address || state || lga) {
      if (updatedUser.buyerProfile) {
        await prisma.buyerProfile.update({
          where: { id: updatedUser.buyerProfile.id },
          data: {
            ...(address && { address }),
            ...(state && { state }),
            ...(lga && { lga }),
          },
        });
      } else {
        await prisma.buyerProfile.create({
          data: {
            userId: targetId,
            address: address || "",
            state: state || "",
            lga: lga || "",
          },
        });
      }
    }

    // 4. Update or create Farmer Profile
    if (farmName || farmDescription !== undefined || farmAddress || state || lga) {
      if (updatedUser.farmerProfile) {
        await prisma.farmerProfile.update({
          where: { id: updatedUser.farmerProfile.id },
          data: {
            ...(farmName && { farmName }),
            ...(farmDescription !== undefined && { farmDescription }),
            ...(farmAddress && { farmAddress }),
            ...(state && { state }),
            ...(lga && { lga }),
          },
        });
      } else if (updatedUser.role === "FARMER") {
        await prisma.farmerProfile.create({
          data: {
            userId: targetId,
            farmName: farmName || `${updatedUser.fullName}'s Farm`,
            farmDescription: farmDescription || "",
            farmAddress: farmAddress || address || "",
            state: state || "Kano",
            lga: lga || "Kano Municipal",
          },
        });
      }
    }

    // 5. Re-fetch the final user with all updated relations — OUTSIDE any transaction
    const finalUser = await prisma.user.findUnique({
      where: { id: targetId },
      include: { buyerProfile: true, farmerProfile: true },
    });

    if (!finalUser) {
      const res = NextResponse.json(createErrorResponse("NOT_FOUND", "User profile not found after update"), { status: 404 });
      return attachTraceHeaders(res, traceCtx);
    }

    const userWithoutPassword = {
      id: finalUser.id,
      fullName: finalUser.fullName,
      email: finalUser.email,
      phoneNumber: finalUser.phoneNumber,
      role: finalUser.role,
      isActive: finalUser.isActive,
      profileImage: finalUser.profileImage,
      createdAt: finalUser.createdAt,
      updatedAt: finalUser.updatedAt,
      buyerProfile: finalUser.buyerProfile,
      farmerProfile: finalUser.farmerProfile,
    };

    const res = NextResponse.json(createSuccessResponse(userWithoutPassword));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    console.error("Error in PATCH /api/user/profile:", err);
    const res = NextResponse.json(createErrorResponse("UPDATE_FAILED", message), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}
