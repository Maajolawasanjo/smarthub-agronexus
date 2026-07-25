async function testFarmerRegister() {
  const timestamp = Date.now();
  const payload = {
    fullName: "Green Acres Farmer",
    email: `farmer_${timestamp}@smarthub.farm`,
    phoneNumber: `0802${timestamp.toString().slice(-7)}`,
    password: "Password123!",
    role: "FARMER",
    farmName: "Green Acres Estate",
    farmAddress: "Plot 40 Agro Industrial Zone, Ibadan",
    state: "Oyo State",
    lga: "Ibadan North"
  };

  console.log("Sending FARMER POST /api/auth/register...");
  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const status = res.status;
  const body = await res.json();
  console.log(`HTTP RESPONSE STATUS: ${status}`);
  console.log(`HTTP RESPONSE BODY:`, JSON.stringify(body, null, 2));
}

testFarmerRegister();
