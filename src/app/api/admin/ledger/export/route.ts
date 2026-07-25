import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

// GET /api/admin/ledger/export — Multi-Format Financial Ledger Exporter (CSV / JSON)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "ledger:export")) {
      return new NextResponse("403 Forbidden: Permission ledger:export required", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportFormat = (searchParams.get("format") || "csv").toLowerCase();

    const orders = await prisma.order.findMany({
      include: {
        buyer: { include: { user: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const ledgerItems = orders.map((o) => {
      const grossAmount = Number(o.totalAmount);
      const platformFee = Number((grossAmount * 0.05).toFixed(2));
      const vat = Number((grossAmount * 0.075).toFixed(2));
      const netPayout = Number((grossAmount - platformFee).toFixed(2));
      const transactionRef = o.payment?.transactionRef || `REF-${o.id.slice(0, 8)}`;
      const timestamp = new Date(o.createdAt).toISOString();

      return {
        transactionRef,
        orderNumber: o.orderNumber,
        buyerName: o.buyer.user.fullName,
        buyerEmail: o.buyer.user.email,
        grossAmountNgn: grossAmount,
        platformFeeNgn: platformFee,
        vatNgn: vat,
        netPayoutNgn: netPayout,
        status: o.status,
        timestamp,
      };
    });

    if (exportFormat === "json") {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalEntries: ledgerItems.length,
        ledger: ledgerItems,
      });
    }

    // Default CSV formatting
    const csvHeader = [
      "Transaction Reference",
      "Order Number",
      "Buyer Name",
      "Buyer Email",
      "Gross Amount (NGN)",
      "Platform Fee (5%)",
      "VAT (7.5%)",
      "Net Payout (NGN)",
      "Status",
      "Timestamp",
    ].join(",");

    const csvRows = ledgerItems.map((item) =>
      [
        `"${item.transactionRef}"`,
        `"${item.orderNumber}"`,
        `"${item.buyerName.replace(/"/g, '""')}"`,
        `"${item.buyerEmail}"`,
        item.grossAmountNgn.toFixed(2),
        item.platformFeeNgn.toFixed(2),
        item.vatNgn.toFixed(2),
        item.netPayoutNgn.toFixed(2),
        `"${item.status}"`,
        `"${item.timestamp}"`,
      ].join(",")
    );

    const csvContent = [csvHeader, ...csvRows].join("\n");
    const filename = `financial-ledger-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(`500 Internal Error: ${err.message}`, { status: 500 });
  }
}
