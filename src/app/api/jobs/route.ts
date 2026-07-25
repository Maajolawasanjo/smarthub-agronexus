import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { runAutoCompleteDeliveredOrdersJob, runWalletReconciliationJob } from "@/jobs";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin authorization required to run background jobs." }, { status: 403 });
    }

    const body = await req.json();
    const { jobName } = body;

    if (jobName === "AUTO_COMPLETE_ORDERS") {
      const result = await runAutoCompleteDeliveredOrdersJob();
      return NextResponse.json({ message: "AutoCompleteDeliveredOrdersJob executed successfully.", result });
    }

    if (jobName === "WALLET_RECONCILIATION") {
      const result = await runWalletReconciliationJob();
      return NextResponse.json({ message: "WalletReconciliationJob executed successfully.", result });
    }

    return NextResponse.json({ error: "Invalid jobName specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Error executing background job:", error);
    return NextResponse.json({ error: error.message || "Failed to execute background job." }, { status: 500 });
  }
}
