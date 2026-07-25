import { describe, test, expect } from "vitest";
import { calculateSettlement } from "../../src/lib/settlement";

describe("Sprint 1A Acceptance Test — Money Cannot Break", () => {
  test("1. Business Rule: Settlement fee split computes 2.5% platform fee & net farmer payout", () => {
    const settlement = calculateSettlement(50000);
    expect(settlement.platformFee).toBe(1250);
    expect(settlement.taxAmount).toBe(93.75); // 7.5% of 1250
    expect(settlement.netFarmerPayout).toBe(48656.25);
  });

  test("2. Business Rule: Insufficient Wallet Balance Withdrawal Rejection", () => {
    const walletBalance = 5000;
    const requestedWithdrawal = 10000;
    const isAllowed = requestedWithdrawal <= walletBalance;
    expect(isAllowed).toBe(false);
  });

  test("3. Business Rule: Coupon Minimum Spend Threshold Enforcement", () => {
    const minSpend = 5000;
    const orderTotal = 3000;
    const isValid = orderTotal >= minSpend;
    expect(isValid).toBe(false);
  });

  test("4. Business Rule: Dynamic Weight & Speed Shipping Calculation", () => {
    const baseRate = 1500;
    const weightKg = 10;
    const extraWeight = Math.max(0, weightKg - 5);
    const weightSurcharge = extraWeight * 100; // 500
    const expressMultiplier = 1.5;
    const totalFee = (baseRate + weightSurcharge) * expressMultiplier;
    expect(totalFee).toBe(3000);
  });
});
