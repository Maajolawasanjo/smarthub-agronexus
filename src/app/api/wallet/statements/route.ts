import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { WalletService } from "@/services/wallet.service";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || "2026";

    const data = await WalletService.getTaxStatementsData(session.userId, year);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
