/**
 * Sprint 1a: Financial Integrity — Money Handling
 *
 * REMEDIATION NOTE (P0-4): Previously 6 tautological assertions on inline closures.
 * Replaced with real financial integrity tests using canonical settlement engine.
 */
import { describe, it, expect } from "vitest";
import { calculateSettlement, reconstructGrossFromPayout } from "@/lib/settlement";

describe("Sprint 1a: Financial Integrity — Settlement Math", () => {
  it("calculateSettlement(0) returns all zeros", () => {
    const result = calculateSettlement(0);
    expect(result.platformFee).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.netFarmerPayout).toBe(0);
  });

  it("conservation: platformFee + taxAmount + netFarmerPayout === grossAmount", () => {
    [1000, 25000, 500000].forEach((gross) => {
      const { platformFee, taxAmount, netFarmerPayout } = calculateSettlement(gross);
      expect(platformFee + taxAmount + netFarmerPayout).toBeCloseTo(gross, 2);
    });
  });

  it("reconstructGrossFromPayout is the exact inverse of calculateSettlement", () => {
    const original = 75000;
    const { netFarmerPayout } = calculateSettlement(original);
    const { grossAmount: reconstructed } = reconstructGrossFromPayout(netFarmerPayout);
    expect(reconstructed).toBeCloseTo(original, 1);
  });
});
