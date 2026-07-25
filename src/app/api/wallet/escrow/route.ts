import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const data = await WalletService.getEscrowDetails(session.userId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { dbOrderId } = await req.json();
    if (!dbOrderId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "dbOrderId is required" } },
        { status: 400 }
      );
    }

    const result = await WalletService.executeEscrowRelease(session.userId, dbOrderId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
