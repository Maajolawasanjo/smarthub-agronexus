import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  getFarmerSession: vi.fn(),
  getAdminSession: vi.fn(),
  productFindUnique: vi.fn(),
  farmerFindUnique: vi.fn(),
  buyerFindUnique: vi.fn(),
  bankCreate: vi.fn(),
  productCreate: vi.fn(),
  orderCreate: vi.fn(),
  verificationUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: mock.getSession,
  getFarmerSession: mock.getFarmerSession,
  getAdminSession: mock.getAdminSession,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findUnique: mock.productFindUnique, create: mock.productCreate },
    farmerProfile: { findUnique: mock.farmerFindUnique },
    buyerProfile: { findUnique: mock.buyerFindUnique },
    bankAccount: { create: mock.bankCreate },
    order: { create: mock.orderCreate },
    verification: { upsert: mock.verificationUpsert },
    $transaction: mock.transaction,
  },
  executeWithDbRetry: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({ recordAuditEvent: vi.fn() }));

import { POST as createProduce } from "@/app/api/farmer/produce/route";
import { POST as placeOrder } from "@/app/api/orders/route";
import { POST as uploadKyc } from "@/app/api/kyc/upload/route";
import { POST as addBank } from "@/app/api/wallet/bank-accounts/route";
import { PATCH as editProduce } from "@/app/api/products/[id]/route";
import { POST as addReview } from "@/app/api/reviews/route";

function mutation(path: string, method: string, origin: string | null, data: object = {}) {
  return new Request(`https://www.smarthubagrochain.online${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(data),
  });
}

function noDatabaseWork() {
  for (const spy of [
    mock.productFindUnique, mock.farmerFindUnique, mock.buyerFindUnique,
    mock.bankCreate, mock.productCreate, mock.orderCreate,
    mock.verificationUpsert, mock.transaction,
  ]) {
    expect(spy).not.toHaveBeenCalled();
  }
}

describe("P0-C2: Farmer and Buyer route write containment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_ORIGIN", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    mock.getSession.mockResolvedValue({ userId: "user_1", role: "BUYER" });
    mock.getFarmerSession.mockResolvedValue({ userId: "farmer_1", role: "FARMER" });
    mock.getAdminSession.mockResolvedValue(null);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("blocks Farmer produce submissions from a foreign Origin before farmer lookup", async () => {
    const res = await createProduce(mutation("/api/farmer/produce", "POST", "https://attacker.example", {
      name: "Maize", price: 1000, stockQuantity: 40, action: "SUBMIT",
    }));
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("blocks Buyer checkout from a foreign Origin before buyer and inventory lookup", async () => {
    const res = await placeOrder(mutation("/api/orders", "POST", "https://attacker.example", {
      items: [{ productId: "p1", quantity: 1 }],
    }));
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("blocks Farmer KYC resubmission from a foreign Origin before writes", async () => {
    const res = await uploadKyc(mutation("/api/kyc/upload", "POST", "https://attacker.example", {
      documentType: "NIN", documentUrl: "https://example.invalid/document",
    }));
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("blocks bank-account creation from a foreign Origin", async () => {
    const res = await addBank(mutation("/api/wallet/bank-accounts", "POST", "https://attacker.example", {
      bankName: "Example", accountName: "Test", accountNumber: "1234567890", bankCode: "000",
    }));
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("blocks edits to an owned product when request origin is foreign", async () => {
    const res = await editProduce(
      mutation("/api/products/p1", "PATCH", "https://attacker.example", { price: 2000 }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("blocks buyer reviews from foreign Origin before buyer lookup", async () => {
    const res = await addReview(mutation("/api/reviews", "POST", "https://attacker.example", {
      productId: "p1", rating: 5,
    }));
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("rejects origin-less authenticated order placement", async () => {
    const res = await placeOrder(mutation("/api/orders", "POST", null, {
      items: [{ productId: "p1", quantity: 1 }],
    }));
    expect(res.status).toBe(403);
    noDatabaseWork();
  });

  it("keeps the standard Farmer-authentication denial for an origin-valid unauthenticated submission", async () => {
    mock.getSession.mockResolvedValue(null);
    mock.getFarmerSession.mockResolvedValue(null);
    const res = await createProduce(mutation("/api/farmer/produce", "POST",
      "https://www.smarthubagrochain.online", { name: "Maize" }));
    expect(res.status).toBe(401);
    noDatabaseWork();
  });
});
