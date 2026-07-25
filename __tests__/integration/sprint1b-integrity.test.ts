import { describe, test, expect } from "vitest";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, "agrosalt", 1000, 64, "sha512").toString("hex");
}

describe("Sprint 1B Acceptance Test — User Data Integrity", () => {
  test("1. Business Rule: Password hashing via crypto PBKDF2", () => {
    const rawPassword = "SecurePassword123!";
    const hashedPassword = hashPassword(rawPassword);

    expect(hashedPassword).not.toBe(rawPassword);
    expect(hashPassword(rawPassword)).toBe(hashedPassword);
  });

  test("2. Business Rule: Profile field email validation logic", () => {
    const validEmail = "farmer@agrochain.com";
    const invalidEmail = "invalid-email-string";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });
});
