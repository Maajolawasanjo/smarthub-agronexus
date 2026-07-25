import { describe, test, expect } from "vitest";
import { calculateSettlement, generateReceipt } from "../src/lib/settlement";

describe("Settlement Engine Unit Tests", () => {
  test("calculateSettlement computes 2.5% platform fee and 7.5% VAT correctly", () => {
    const grossAmount = 10000;
    const breakdown = calculateSettlement(grossAmount);

    expect(breakdown.grossAmount).toBe(10000);
    expect(breakdown.platformFeeRate).toBe(0.025);
    expect(breakdown.platformFee).toBe(250);
    expect(breakdown.taxAmount).toBe(18.75);
    expect(breakdown.netFarmerPayout).toBe(9731.25);
  });

  test("generateReceipt builds structured receipt DTO", () => {
    const receipt = generateReceipt("ORD-1001", "TX-888", "CARD", 5000);
    expect(receipt.receiptNumber).toContain("REC-");
    expect((receipt as any).amountPaid).toBeUndefined(); // Uses breakdown.grossAmount
    expect(receipt.grossAmount).toBe(5000);
    expect(receipt.paymentMethod).toBe("CARD");
  });
});
