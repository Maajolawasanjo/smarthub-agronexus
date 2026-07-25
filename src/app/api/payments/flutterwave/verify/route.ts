import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");
    const status = searchParams.get("status");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (status === "cancelled") {
      return NextResponse.redirect(`${appUrl}/cart?payment=cancelled`);
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey || !transactionId) {
      return NextResponse.redirect(`${appUrl}/cart?payment=failed&reason=invalid_params`);
    }

    // Verify transaction with Flutterwave API
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (
      verifyRes.ok &&
      verifyData.status === "success" &&
      verifyData.data?.status === "successful"
    ) {
      // Payment verified successfully!
      const paidAmount = verifyData.data.amount;
      const ref = verifyData.data.tx_ref || txRef;

      return NextResponse.redirect(
        `${appUrl}/cart?payment=success&ref=${encodeURIComponent(ref)}&amount=${paidAmount}`
      );
    }

    return NextResponse.redirect(`${appUrl}/cart?payment=failed&reason=verification_failed`);
  } catch (error) {
    console.error("[FLUTTERWAVE_VERIFY_ERROR]", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/cart?payment=error`);
  }
}
