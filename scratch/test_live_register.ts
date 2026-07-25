async function testLiveRegister() {
  const timestamp = Date.now();
  const payload = {
    fullName: "Forensic Audit Buyer",
    email: `auditbuyer_${timestamp}@smarthub.farm`,
    phoneNumber: `0803${timestamp.toString().slice(-7)}`,
    password: "Password123!",
    role: "BUYER",
    address: "12 Commerce Way, Lagos",
    state: "Lagos State",
    lga: "Ikeja"
  };

  console.log("Sending POST /api/auth/register with payload:", payload);
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const body = await res.json();
    console.log(`\n=============================================`);
    console.log(`HTTP RESPONSE STATUS: ${status}`);
    console.log(`HTTP RESPONSE BODY:`, JSON.stringify(body, null, 2));
    console.log(`=============================================\n`);
  } catch (err: any) {
    console.error("HTTP FETCH FAILED:", err);
  }
}

testLiveRegister();
