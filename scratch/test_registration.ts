import { prisma } from "../src/lib/prisma";

async function testRegistration() {
  try {
    const testEmail = `testbuyer_${Date.now()}@example.com`;
    console.log("Testing user lookup with email:", testEmail);
    const existing = await prisma.user.findFirst({
      where: { email: testEmail }
    });
    console.log("Existing user result:", existing);
  } catch (err: any) {
    console.error("EXACT PRISMA REGISTRATION ERROR:", err?.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
