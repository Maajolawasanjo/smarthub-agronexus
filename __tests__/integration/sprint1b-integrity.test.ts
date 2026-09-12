/**
 * Sprint 1b: Data Integrity
 *
 * REMEDIATION NOTE (P0-4): Previously 4 tautological assertions on inline closures.
 * Replaced with real integrity tests.
 */
import { describe, it, expect } from "vitest";
import { calculateSettlement } from "@/lib/settlement";
import { config } from "@/lib/config";

describe("Sprint 1b: Platform Config & Data Integrity", () => {
  it("config.fees.platformFeeRate is 0.05 (5%)", () => {
    expect(config.fees.platformFeeRate).toBe(0.05);
  });

  it("config.fees.vatRate is 0.075 (7.5%)", () => {
    expect(config.fees.vatRate).toBe(0.075);
  });

  it("settlement with very small amount (₦1) still produces valid breakdown", () => {
    const { platformFee, taxAmount, netFarmerPayout, grossAmount } = calculateSettlement(1);
    expect(platformFee + taxAmount + netFarmerPayout).toBeCloseTo(grossAmount, 1);
  });
});
