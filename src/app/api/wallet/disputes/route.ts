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

    const data = await WalletService.getDisputesData(session.userId);
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

    const { orderId, title, description } = await req.json();
    if (!orderId || !title || !description) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "orderId, title, and description are required" } },
        { status: 400 }
      );
    }

    const dispute = await WalletService.createDispute(session.userId, orderId, title, description);
    return NextResponse.json({ success: true, data: dispute });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
