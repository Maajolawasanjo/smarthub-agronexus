import { describe, test, expect } from "vitest";
import { evaluateTrustPolicy } from "../src/lib/trust";

describe("Trust Engine Unit Tests", () => {
  test("evaluateTrustPolicy evaluates UNVERIFIED status as Tier 1", () => {
    const policy = evaluateTrustPolicy("UNVERIFIED");
    expect(policy.tier).toBe("UNVERIFIED");
    expect(policy.canPublishProducts).toBe(true);
    expect(policy.canWithdraw).toBe(true);
    expect(policy.dailyWithdrawalLimit).toBe(1000);
  });

  test("evaluateTrustPolicy evaluates APPROVED status as Tier 2 Verified Producer", () => {
    const policy = evaluateTrustPolicy("APPROVED");
    expect(policy.tier).toBe("VERIFIED_PRODUCER");
    expect(policy.canPublishProducts).toBe(true);
    expect(policy.canWithdraw).toBe(true);
    expect(policy.badge.code).toBe("VERIFIED_PRODUCER");
    expect(policy.dailyWithdrawalLimit).toBe(100000);
  });
});
