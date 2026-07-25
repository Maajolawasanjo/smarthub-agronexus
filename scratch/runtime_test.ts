async function runRuntimeTest() {
    console.log("=== STARTING RUNTIME EVIDENCE AUDIT ===");

    // 1. Authenticate session via /api/auth/login
    console.log("\n[1] Authenticating Buyer Session...");
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "buyer@smarthub.com", password: "password123" })
    });
    
    const loginData = await loginRes.json();
    console.log("Login HTTP Status:", loginRes.status);
    console.log("Login Response Payload:", JSON.stringify(loginData, null, 2));

    const cookieHeader = loginRes.headers.get("set-cookie") || "";
    console.log("Session Cookie captured:", cookieHeader.split(";")[0]);

    // 2. Fetch Live PostgreSQL Products via /api/products
    console.log("\n[2] Fetching Live Marketplace Products...");
    const prodRes = await fetch("http://localhost:3000/api/products", {
        headers: { "Cookie": cookieHeader }
    });
    const prodData = await prodRes.json();
    const liveProducts = prodData.products || prodData || [];
    console.log("Live DB Products Count:", liveProducts.length);
    if (liveProducts.length > 0) {
        console.log("First DB Product Sample:", {
            id: liveProducts[0].id,
            name: liveProducts[0].name,
            price: liveProducts[0].price,
            isAvailable: liveProducts[0].isAvailable
        });
    }

    // 3. RUNTIME TEST CASE A: Reproducing Contradiction #2 (Unmapped / Undefined Product IDs)
    console.log("\n[3] RUNTIME TEST CASE A: Unmapped Product IDs (Mock / Null IDs)");
    const unmappedCartItems = [
        { id: undefined, name: "Unmapped Mock Crop", price: 1000, quantity: 2 },
        { id: "", name: "Empty ID Item", price: 500, quantity: 1 }
    ];

    console.log("  a) Client Cart Items Count (Before Filter):", unmappedCartItems.length);
    const unmappedPayloadItems = unmappedCartItems.map(item => ({
        productId: String(item.id || ""),
        quantity: Number(item.quantity) || 1
    })).filter(i => Boolean(i.productId));

    console.log("  b) Payload Items Count (After filter(Boolean(i.productId))):", unmappedPayloadItems.length);
    console.log("  c) Exact JSON Payload sent to /api/orders/validate:", JSON.stringify({ items: unmappedPayloadItems }));

    const resA = await fetch("http://localhost:3000/api/orders/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookieHeader
        },
        body: JSON.stringify({ items: unmappedPayloadItems })
    });
    const dataA = await resA.json();
    console.log("  d) Exact HTTP Status returned:", resA.status);
    console.log("  e) Exact JSON Response returned:", JSON.stringify(dataA, null, 2));

    // 4. RUNTIME TEST CASE B: Valid PostgreSQL Product Checkout Validation
    console.log("\n[4] RUNTIME TEST CASE B: Live PostgreSQL Product Cart Validation");
    const validProductId = liveProducts.length > 0 ? liveProducts[0].id : "cmrqrkc9l000avtxss2ds1pnz";
    const validCartItems = [
        { id: validProductId, name: liveProducts[0]?.name || "Sesame Seeds", price: 1850, quantity: 3 }
    ];

    console.log("  a) Client Cart Items Count (Before Filter):", validCartItems.length);
    const validPayloadItems = validCartItems.map(item => ({
        productId: String(item.id),
        quantity: Number(item.quantity) || 1
    })).filter(i => Boolean(i.productId));

    console.log("  b) Payload Items Count (After Filter):", validPayloadItems.length);
    console.log("  c) Exact JSON Payload sent to /api/orders/validate:", JSON.stringify({ items: validPayloadItems }));

    const resB = await fetch("http://localhost:3000/api/orders/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookieHeader
        },
        body: JSON.stringify({ items: validPayloadItems })
    });
    const dataB = await resB.json();
    console.log("  d) Exact HTTP Status returned:", resB.status);
    console.log("  e) Exact JSON Response returned:", JSON.stringify(dataB, null, 2));

    // 5. RUNTIME TEST CASE C: End-to-End Order Creation & Inventory Deduction
    console.log("\n[5] RUNTIME TEST CASE C: Full Transaction Order Creation (/api/orders)");
    const orderPayload = {
        items: validPayloadItems,
        shippingAddress: "Plot 12 Marina, Lagos",
        incoterm: "FOB",
        paymentMethod: "CARD"
    };
    console.log("  a) Order JSON Payload sent to /api/orders:", JSON.stringify(orderPayload, null, 2));

    const resC = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookieHeader
        },
        body: JSON.stringify(orderPayload)
    });
    const dataC = await resC.json();
    console.log("  b) Exact HTTP Status returned:", resC.status);
    console.log("  c) Exact JSON Response returned:", JSON.stringify(dataC, null, 2));

    console.log("\n=== RUNTIME EVIDENCE AUDIT COMPLETE ===");
}

runRuntimeTest().catch(console.error);
