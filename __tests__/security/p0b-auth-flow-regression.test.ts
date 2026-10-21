import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  findExisting: vi.fn(),
  findLoginUser: vi.fn(),
  createUser: vi.fn(),
  createFarmer: vi.fn(),
  createBuyer: vi.fn(),
  findCreated: vi.fn(),
  transaction: vi.fn(),
  createRealmSession: vi.fn(),
  setRealmSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: mock.findExisting,
      findUnique: mock.findLoginUser,
    },
    $transaction: mock.transaction,
  },
}));

vi.mock("@/lib/session", () => ({
  AuthRealm: { ADMIN: "ADMIN", FARMER: "FARMER", BUYER: "BUYER" },
  VAULT_COOKIE_NAME: "smarthub_vault_id",
  createRealmSession: mock.createRealmSession,
  setRealmSessionCookie: mock.setRealmSessionCookie,
  clearSessionCookie: mock.clearSessionCookie,
  isRealmAllowed: (role: string, realm: string) => role === realm,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
}));

vi.mock("bcrypt", () => ({
  default: { hash: mock.hash, compare: mock.compare },
}));

vi.mock("@/lib/user-dto", () => ({
  formatAuthenticatedUser: (user: { id: string; role: string }) => ({
    id: user.id,
    role: user.role,
  }),
}));

import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";

function request(route: "register" | "login", body: Record<string, unknown>) {
  return new Request(`http://localhost:3000/api/auth/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const buyer = {
  id: "buyer_one",
  email: "buyer@example.invalid",
  fullName: "Test Buyer",
  password: "stored-hash",
  role: "BUYER",
  isActive: true,
};

const farmer = {
  ...buyer,
  id: "farmer_one",
  email: "farmer@example.invalid",
  role: "FARMER",
};

describe("P0-B: registration and login issue only database-backed realm sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.findExisting.mockResolvedValue(null);
    mock.hash.mockResolvedValue("hashed-password");
    mock.compare.mockResolvedValue(true);
    mock.createRealmSession.mockResolvedValue({ rawSecret: "registry-token", session: { id: "new_session" } });
    mock.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: mock.createUser,
          findUniqueOrThrow: mock.findCreated,
        },
        buyerProfile: { create: mock.createBuyer },
        farmerProfile: { create: mock.createFarmer },
      };
      return fn(tx);
    });
    mock.createUser.mockResolvedValue(buyer);
    mock.findCreated.mockResolvedValue(buyer);
    mock.findLoginUser.mockResolvedValue(buyer);
  });

  it("registers a Buyer and creates the BUYER registry session without legacy JWT", async () => {
    const res = await register(request("register", {
      fullName: buyer.fullName,
      email: buyer.email,
      phoneNumber: "08000000000",
      password: "not-shared-here",
      role: "BUYER",
    }));
    expect(res.status).toBe(201);
    expect(mock.createBuyer).toHaveBeenCalledOnce();
    expect(mock.createRealmSession).toHaveBeenCalledWith(
      buyer.id, "BUYER", expect.stringMatching(/^vlt_/), undefined, undefined,
    );
    expect(mock.setRealmSessionCookie).toHaveBeenCalledWith("BUYER", "registry-token", expect.any(String));
    expect(mock.clearSessionCookie).toHaveBeenCalledOnce();
  });

  it("registers a Farmer and creates the FARMER registry session", async () => {
    mock.createUser.mockResolvedValue(farmer);
    mock.findCreated.mockResolvedValue(farmer);
    const res = await register(request("register", {
      fullName: farmer.fullName,
      email: farmer.email,
      phoneNumber: "08000000001",
      password: "not-shared-here",
      role: "FARMER",
      farmName: "Example Farm",
    }));
    expect(res.status).toBe(201);
    expect(mock.createFarmer).toHaveBeenCalledOnce();
    expect(mock.createRealmSession).toHaveBeenCalledWith(
      farmer.id, "FARMER", expect.any(String), undefined, undefined,
    );
  });

  it("rejects public ADMIN registration without a database write", async () => {
    const res = await register(request("register", {
      fullName: "Admin",
      email: "admin@example.invalid",
      phoneNumber: "08000000002",
      password: "not-shared-here",
      role: "ADMIN",
    }));
    expect(res.status).toBe(403);
    expect(mock.transaction).not.toHaveBeenCalled();
    expect(mock.createRealmSession).not.toHaveBeenCalled();
  });

  it("reports that an account exists if session issuance fails after registration", async () => {
    mock.createRealmSession.mockRejectedValue(new Error("simulated session DB unavailable"));
    const res = await register(request("register", {
      fullName: buyer.fullName,
      email: buyer.email,
      phoneNumber: "08000000000",
      password: "not-shared-here",
      role: "BUYER",
    }));
    const data = await res.json();
    expect(res.status).toBe(503);
    expect(data.accountCreated).toBe(true);
    expect(mock.setRealmSessionCookie).not.toHaveBeenCalled();
  });

  it("logs in an existing Admin only in the ADMIN realm, without creating a legacy token", async () => {
    mock.findLoginUser.mockResolvedValue({ ...buyer, role: "ADMIN" });
    const res = await login(request("login", {
      email: buyer.email,
      password: "not-shared-here",
      requestedRealm: "ADMIN",
    }));
    expect(res.status).toBe(200);
    expect(mock.createRealmSession).toHaveBeenCalledWith(
      buyer.id, "ADMIN", expect.any(String), undefined, undefined,
    );
    expect(mock.setRealmSessionCookie).toHaveBeenCalledWith("ADMIN", "registry-token", expect.any(String));
    expect(mock.clearSessionCookie).toHaveBeenCalledOnce();
  });

  it("refuses a Buyer trying to log into the ADMIN realm", async () => {
    const res = await login(request("login", {
      email: buyer.email,
      password: "not-shared-here",
      requestedRealm: "ADMIN",
    }));
    expect(res.status).toBe(403);
    expect(mock.createRealmSession).not.toHaveBeenCalled();
  });

  it("refuses a deactivated account even when the password is correct", async () => {
    mock.findLoginUser.mockResolvedValue({ ...farmer, isActive: false });
    const res = await login(request("login", {
      email: farmer.email,
      password: "not-shared-here",
      requestedRealm: "FARMER",
    }));
    expect(res.status).toBe(403);
    expect(mock.compare).not.toHaveBeenCalled();
    expect(mock.createRealmSession).not.toHaveBeenCalled();
  });
});
