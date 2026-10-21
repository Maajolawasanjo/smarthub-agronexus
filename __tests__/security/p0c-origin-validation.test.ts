import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTrustedMutationOrigin, PRODUCTION_ORIGIN } from "@/lib/csrf";

const makeRequest = (headers: Record<string, string> = {}) =>
  new Request("https://www.smarthubagrochain.online/api/admin/products/123/approve", {
    method: "PUT",
    headers,
  });

describe("Phase 0-C — fail-closed origin validation", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", undefined);
    vi.stubEnv("APP_ORIGIN", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the canonical production host when NEXT_PUBLIC_APP_URL is absent", () => {
    expect(PRODUCTION_ORIGIN).toBe("https://www.smarthubagrochain.online");
    expect(isTrustedMutationOrigin(makeRequest({ origin: PRODUCTION_ORIGIN }))).toBe(true);
  });

  it("allows a genuine same-origin Referer URL and accepts a matching Origin plus Referer", () => {
    expect(isTrustedMutationOrigin(makeRequest({
      referer: `${PRODUCTION_ORIGIN}/admin/products?id=5`,
      "sec-fetch-site": "same-origin",
    }))).toBe(true);
    expect(isTrustedMutationOrigin(makeRequest({
      origin: PRODUCTION_ORIGIN,
      referer: `${PRODUCTION_ORIGIN}/admin/products`,
    }))).toBe(true);
  });

  it.each([
    {},
    { origin: "null" },
    { origin: "garbage" },
    { origin: "http://www.smarthubagrochain.online" },
    { origin: "https://smarthubagrochain.online" },
    { origin: "https://www.smarthubagrochain.online.evil.example" },
    { origin: "https://www.smarthubagrochain.online:444" },
    { origin: "http://localhost:3000" },
    { origin: PRODUCTION_ORIGIN, referer: "https://evil.example/form" },
    { referer: "https://www.smarthubagrochain.online.evil.example/admin" },
    { origin: PRODUCTION_ORIGIN, "sec-fetch-site": "cross-site" },
    { origin: PRODUCTION_ORIGIN, "sec-fetch-site": "same-site" },
    { origin: "https://www.smarthubagrochain.online/path" },
    { origin: "https://attacker@www.smarthubagrochain.online" },
  ])("rejects missing, mismatched, spoofed or cross-site request headers (%j)", (headers) => {
    expect(isTrustedMutationOrigin(makeRequest(headers))).toBe(false);
  });

  it("does not use spoofed request Host or X-Forwarded-Host as allowlist sources", () => {
    expect(isTrustedMutationOrigin(makeRequest({
      host: "evil.example",
      "x-forwarded-host": "evil.example",
      origin: "https://evil.example",
    }))).toBe(false);
  });

  it("honors an operator-supplied HTTPS production origin", () => {
    vi.stubEnv("APP_ORIGIN", "https://agro.example.org");
    expect(isTrustedMutationOrigin(makeRequest({ origin: "https://agro.example.org" }))).toBe(true);
    expect(isTrustedMutationOrigin(makeRequest({ origin: PRODUCTION_ORIGIN }))).toBe(false);
  });

  it("fails closed if the operator configures an insecure HTTP production origin", () => {
    vi.stubEnv("APP_ORIGIN", "http://agro.example.org");
    expect(isTrustedMutationOrigin(makeRequest({ origin: PRODUCTION_ORIGIN }))).toBe(false);
    expect(isTrustedMutationOrigin(makeRequest({ origin: "http://agro.example.org" }))).toBe(false);
  });

  it("permits only the exact trusted Vercel preview host during preview deployment", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "agro-review-abc.vercel.app");
    expect(isTrustedMutationOrigin(makeRequest({
      origin: "https://agro-review-abc.vercel.app",
    }))).toBe(true);
    expect(isTrustedMutationOrigin(makeRequest({
      origin: "https://agro-review-bad.vercel.app",
    }))).toBe(false);
  });

  it("keeps local development origin constrained to its explicitly configured host", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", undefined);
    expect(isTrustedMutationOrigin(makeRequest({ origin: "http://localhost:3000" }))).toBe(true);
    expect(isTrustedMutationOrigin(makeRequest({ origin: "http://localhost.evil.example:3000" }))).toBe(false);
  });
});
