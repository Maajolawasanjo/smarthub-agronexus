import { describe, test, expect } from "vitest";
import {
  isValidFulfillmentTransition,
  deriveFulfillmentActions,
  canReleaseEscrow,
} from "../src/lib/fulfillment";

describe("Fulfillment Engine Unit Tests", () => {
  test("isValidFulfillmentTransition validates order state transitions correctly", () => {
    expect(isValidFulfillmentTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(isValidFulfillmentTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(isValidFulfillmentTransition("DELIVERED", "COMPLETED")).toBe(true);
    expect(isValidFulfillmentTransition("PENDING", "COMPLETED")).toBe(false);
  });

  test("canReleaseEscrow only allows escrow release on DELIVERED orders", () => {
    expect(canReleaseEscrow("DELIVERED", "PAID")).toBe(true);
    expect(canReleaseEscrow("IN_TRANSIT", "PAID")).toBe(false);
    expect(canReleaseEscrow("PENDING", "UNPAID")).toBe(false);
  });

  test("deriveFulfillmentActions computes correct actions for BUYER", () => {
    const deliveredActions = deriveFulfillmentActions("DELIVERED", "BUYER");
    expect(deliveredActions.canConfirmBuyerReceipt).toBe(true);

    const pendingActions = deriveFulfillmentActions("PENDING", "BUYER");
    expect(pendingActions.canCancelOrder).toBe(true);
  });
});
