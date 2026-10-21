import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isTrustedMutationOrigin } from "@/lib/csrf";
import { getSettlementDTO } from "@/services/payment.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { orderId } = await params;
    const dto = await getSettlementDTO(orderId, {
      userId: session.userId,
      role: session.role,
    });

    // Return 404 for non-owners so the endpoint does not disclose whether another
    // buyer has a settlement record.
    if (!dto) {
      return NextResponse.json({ error: "Settlement record not found." }, { status: 404 });
    }

    return NextResponse.json(dto);
  } catch (error) {
    console.error("Error fetching settlement DTO:", error);
    return NextResponse.json({ error: "Internal server error fetching settlement details." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only an administrator may initiate a formal refund review." },
      { status: 403 }
    );
  }
  if (!isTrustedMutationOrigin(req)) {
    return NextResponse.json({ error: "Untrusted mutation origin." }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "REFUND") {
    return NextResponse.json({ error: "Invalid settlement action." }, { status: 400 });
  }

  // Do not mark a payment as REFUNDED unless the source-specific refund has actually
  // succeeded. This legacy endpoint has no provider transaction ID or refund proof;
  // use the formal dispute/refund workflow until that capability is available.
  console.warn("[DIRECT_SETTLEMENT_REFUND_BLOCKED]", { orderId, actorId: session.userId });
  return NextResponse.json(
    {
      error: "Direct settlement refunds are disabled because this endpoint cannot verify a provider refund. Resolve the order through the formal dispute workflow.",
      code: "REFUND_WORKFLOW_REQUIRED",
    },
    { status: 409 }
  );
}
