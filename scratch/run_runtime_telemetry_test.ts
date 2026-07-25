import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "smarthub-agrochain-production-secret-key-2026";
const SESSION_COOKIE_NAME = "smarthub_session";

function signSessionToken(payload: { userId: string; email: string; role: "BUYER" | "FARMER" | "ADMIN" }) {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const fullPayload = { ...payload, exp };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

async function executeRuntimeTest() {
  console.log("=================================================");
  console.log(" RUNTIME EVIDENCE AUDIT: EXECUTION CAPTURE");
  console.log("=================================================\n");

  const validToken = signSessionToken({
    userId: "cmrqrkbuyer0001",
    email: "buyer@smarthub.com",
    role: "BUYER"
  });

  const authCookieHeader = `${SESSION_COOKIE_NAME}=${validToken}`;
  console.log("[TEST_RUNNER] Signed Valid Session JWT Cookie:");
  console.log(`  Cookie: ${authCookieHeader.substring(0, 45)}...\n`);

  // ── 1. TEST CASE 1: Unmapped / Undefined Product IDs (Reproducing Contradiction #2 & Browser 400) ──
  console.log("-------------------------------------------------");
  console.log(" SCENARIO 1: Unmapped Product IDs (Mock/Undefined)");
  console.log("-------------------------------------------------");

  const cartStateScenario1 = [
    { id: undefined, name: "Unmapped Mock Yam", quantity: 2, price: 1200 },
    { id: "", name: "Empty Product ID", quantity: 1, price: 500 }
  ];
  console.log(`[CLIENT_CART_UI] Total Items in Cart State: ${cartStateScenario1.length}`);

  // Payload mapper logic from src/app/cart/page.tsx
  const payloadScenario1Items = cartStateScenario1
    .map(item => ({
      productId: String(item.id || ""),
      quantity: Number(item.quantity) || 1
    }))
    .filter(i => Boolean(i.productId));

  console.log(`[CLIENT_PAYLOAD_BUILDER] Items count after filter(Boolean(i.productId)): ${payloadScenario1Items.length}`);
  const jsonBodyScenario1 = JSON.stringify({ items: payloadScenario1Items });
  console.log(`[CLIENT_HTTP_POST] JSON Payload sent: ${jsonBodyScenario1}`);

  const res1 = await fetch("http://localhost:3000/api/orders/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": authCookieHeader
    },
    body: jsonBodyScenario1
  });

  const responseText1 = await res1.text();
  console.log(`[SERVER_HTTP_RESPONSE] Status Code: ${res1.status}`);
  console.log(`[SERVER_HTTP_RESPONSE] Response Body: ${responseText1}\n`);

  // ── 2. TEST CASE 2: Valid Live PostgreSQL Product ID ──
  console.log("-------------------------------------------------");
  console.log(" SCENARIO 2: Valid PostgreSQL Product Checkout Validation");
  console.log("-------------------------------------------------");

  const livePostgresProductId = "cmrqrkc9l000avtxss2ds1pnz"; // Premium Natural White Sesame Seeds
  const cartStateScenario2 = [
    { id: livePostgresProductId, name: "Premium Natural White Sesame Seeds", quantity: 3, price: 1850 }
  ];
  console.log(`[CLIENT_CART_UI] Total Items in Cart State: ${cartStateScenario2.length}`);

  const payloadScenario2Items = cartStateScenario2
    .map(item => ({
      productId: String(item.id),
      quantity: Number(item.quantity) || 1
    }))
    .filter(i => Boolean(i.productId));

  console.log(`[CLIENT_PAYLOAD_BUILDER] Items count after filter(Boolean(i.productId)): ${payloadScenario2Items.length}`);
  const jsonBodyScenario2 = JSON.stringify({ items: payloadScenario2Items });
  console.log(`[CLIENT_HTTP_POST] JSON Payload sent: ${jsonBodyScenario2}`);

  const res2 = await fetch("http://localhost:3000/api/orders/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": authCookieHeader
    },
    body: jsonBodyScenario2
  });

  const responseText2 = await res2.text();
  console.log(`[SERVER_HTTP_RESPONSE] Status Code: ${res2.status}`);
  console.log(`[SERVER_HTTP_RESPONSE] Response Body:\n${responseText2}\n`);

  console.log("=================================================");
  console.log(" RUNTIME EVIDENCE CAPTURE COMPLETE");
  console.log("=================================================");
}

executeRuntimeTest().catch(console.error);
