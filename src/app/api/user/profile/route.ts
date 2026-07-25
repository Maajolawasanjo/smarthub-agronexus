import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { createTraceContext, attachTraceHeaders } from "@/lib/tracing";

// Helper to resolve authenticated user ID
async function getAuthenticatedUserId(): Promise<{ userId: string; email?: string }> {
  const session = await getSession();
  if (session?.userId) {
    return { userId: session.userId, email: session.email };
  }
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("userId")?.value;
  return { userId: cookieUserId || "usr_demo_buyer" };
}

// GET /api/user/profile — Fetch current user profile with role-specific data
export async function GET(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const { userId, email } = await getAuthenticatedUserId();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          ...(email ? [{ email }] : []),
        ],
      },
      include: {
        buyerProfile: true,
        farmerProfile: true,
      },
    });

    if (!user) {
      // Create fallback demo user record if missing
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email || "user@smarthub-agro.com",
          fullName: "Nathan Ma'ajo",
          phoneNumber: "+2348012345678",
          password: "demo_password_hash",
          role: "BUYER",
          buyerProfile: {
            create: {
              address: "12 Agricultural Extension Way",
              state: "Kano State",
            },
          },
        },
        include: {
          buyerProfile: true,
          farmerProfile: true,
        },
      });
    }

    const { password, ...userWithoutPassword } = user;

    const res = NextResponse.json(createSuccessResponse(userWithoutPassword));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in GET /api/user/profile:", err);
    const res = NextResponse.json(createErrorResponse("FETCH_FAILED", err.message || "Failed to fetch user profile"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}

// PATCH /api/user/profile — Persist profile updates to PostgreSQL
export async function PATCH(req: Request) {
  const traceCtx = createTraceContext(req);
  try {
    const { userId, email } = await getAuthenticatedUserId();
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

    // 1. Locate or create target user (outside transaction to avoid stale-tx issues)
    let targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          ...(email ? [{ email }] : []),
          ...(bodyEmail ? [{ email: bodyEmail }] : []),
        ],
      },
      include: { buyerProfile: true, farmerProfile: true },
    });

    if (!targetUser) {
      // Create minimal user record then update profile fields
      targetUser = await prisma.user.create({
        data: {
          id: userId,
          email: bodyEmail || email || "user@smarthub-agro.com",
          fullName: fullName || "Nathan Ma'ajo",
          phoneNumber: phoneNumber || `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          password: "demo_password_hash",
          profileImage: profileImage || undefined,
          role: "BUYER",
          buyerProfile: {
            create: {
              address: address || "Kano Central Market",
              state: state || "Kano",
              lga: lga || "Kano Municipal",
            },
          },
        },
        include: { buyerProfile: true, farmerProfile: true },
      });


      const fresh = await prisma.user.findUnique({
        where: { id: targetUser.id },
        include: { buyerProfile: true, farmerProfile: true },
      });
      const { password, ...userWithoutPassword } = fresh!;
      const res = NextResponse.json(createSuccessResponse(userWithoutPassword));
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

    const { password, ...userWithoutPassword } = finalUser;

    const res = NextResponse.json(createSuccessResponse(userWithoutPassword));
    return attachTraceHeaders(res, traceCtx);
  } catch (err: any) {
    console.error("Error in PATCH /api/user/profile:", err);
    const res = NextResponse.json(createErrorResponse("UPDATE_FAILED", err.message || "Failed to update profile"), { status: 500 });
    return attachTraceHeaders(res, traceCtx);
  }
}
