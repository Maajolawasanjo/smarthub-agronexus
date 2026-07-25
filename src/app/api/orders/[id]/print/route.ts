import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/orders/[id]/print — Returns printer-friendly HTML document
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("<h1>401 Unauthorized</h1>", { status: 401, headers: { "Content-Type": "text/html" } });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { include: { user: true } },
        orderItems: { include: { product: true } },
        payment: true,
      },
    });

    if (!order) {
      return new NextResponse("<h1>404 Order Not Found</h1>", { status: 404, headers: { "Content-Type": "text/html" } });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${order.orderNumber} — Official Receipt & Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1B4D28; padding-bottom: 20px; }
          .brand { color: #1B4D28; font-size: 24px; font-weight: bold; }
          .section { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f4f4f4; }
          .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="background:#1B4D28;color:white;padding:10px 20px;border:none;border-radius:20px;cursor:pointer;font-weight:bold;">
            Print / Save as PDF
          </button>
        </div>
        <div class="header">
          <div>
            <div class="brand">SmartHub AgroChain</div>
            <p>Official Order & Escrow Invoice</p>
          </div>
          <div style="text-align:right;">
            <h3>Order #${order.orderNumber}</h3>
            <p>Date: ${new Date(order.createdAt).toLocaleDateString("en-GB")}</p>
            <p>Status: <strong>${order.status}</strong></p>
          </div>
        </div>

        <div class="section">
          <h4>Customer Details</h4>
          <p><strong>Name:</strong> ${order.buyer.user.fullName}</p>
          <p><strong>Email:</strong> ${order.buyer.user.email}</p>
          <p><strong>Address:</strong> ${order.buyer.address || "N/A"}</p>
        </div>

        <div class="section">
          <h4>Order Items</h4>
          <table>
            <thead>
              <tr>
                <th>Product Item</th>
                <th>Quantity</th>
                <th>Price (NGN)</th>
                <th>Total (NGN)</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>₦${Number(item.unitPrice).toLocaleString()}</td>
                  <td>₦${Number(item.subtotal).toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">
            Total Amount Paid: ₦${Number(order.totalAmount).toLocaleString()}
          </div>
        </div>

        <div class="section" style="margin-top:50px;font-size:12px;color:#777;border-top:1px solid #ddd;padding-top:10px;">
          <p>SmartHub AgroChain Marketplace — Protected by Escrow Trust Engine.</p>
          <p>Reference: ${order.payment?.transactionRef || order.id}</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (err: any) {
    return new NextResponse("<h1>500 Internal Error</h1>", { status: 500, headers: { "Content-Type": "text/html" } });
  }
}
