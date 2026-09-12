import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Smarthub Agrochain production database seed...");

  // 1. Create Default Passwords
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 2. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@smarthubagro.com" },
    update: {},
    create: {
      fullName: "System Super Administrator",
      email: "admin@smarthubagro.com",
      phoneNumber: "+2348000000001",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // 3. Seed Farmers & Farmer Profiles
  const farmerUser1 = await prisma.user.upsert({
    where: { email: "farmer@smarthubagro.com" },
    update: {},
    create: {
      fullName: "Alhaji Ibrahim Danfulani",
      email: "farmer@smarthubagro.com",
      phoneNumber: "+2348031234567",
      password: hashedPassword,
      role: "FARMER",
      farmerProfile: {
        create: {
          farmName: "Kano Agro Cooperative Society",
          farmDescription: "Premium exporter of Sesame Seeds, Ginger, and Cashew Nuts with 500+ smallholder farmers.",
          farmAddress: "Plot 12 Industrial Layout, Sharada",
          state: "Kano State",
          lga: "Kano Municipal",
          verificationStatus: "APPROVED",
        },
      },
    },
    include: { farmerProfile: true },
  });

  const farmerUser2 = await prisma.user.upsert({
    where: { email: "emeka.benue@smarthubagro.com" },
    update: {},
    create: {
      fullName: "Chief Emeka Okafor",
      email: "emeka.benue@smarthubagro.com",
      phoneNumber: "+2348037654321",
      password: hashedPassword,
      role: "FARMER",
      farmerProfile: {
        create: {
          farmName: "Benue Agro-Venture Estates",
          farmDescription: "Large-scale commercial tuber and root crop cultivator in the Food Basket of the Nation.",
          farmAddress: "Kilometer 14 Makurdi-Gboko Expressway",
          state: "Benue State",
          lga: "Makurdi",
          verificationStatus: "APPROVED",
        },
      },
    },
    include: { farmerProfile: true },
  });

  const farmerUser3 = await prisma.user.upsert({
    where: { email: "folashade.cocoa@smarthubagro.com" },
    update: {},
    create: {
      fullName: "Folashade Adebayo",
      email: "folashade.cocoa@smarthubagro.com",
      phoneNumber: "+2348029876543",
      password: hashedPassword,
      role: "FARMER",
      farmerProfile: {
        create: {
          farmName: "Ondo Sun-Gold Cocoa & Cashew Co.",
          farmDescription: "Specialist producers of fair-trade fermented export cocoa beans and raw cashew nuts.",
          farmAddress: "Ondo-Akure Forest Reserve Belt",
          state: "Ondo State",
          lga: "Idanre",
          verificationStatus: "APPROVED",
        },
      },
    },
    include: { farmerProfile: true },
  });

  // 4. Seed Buyer User, Profile & Saved Addresses
  const buyerUser = await prisma.user.upsert({
    where: { email: "buyer@smarthubagro.com" },
    update: {},
    create: {
      fullName: "Marcus Vance",
      email: "buyer@smarthubagro.com",
      phoneNumber: "+2348098765432",
      password: hashedPassword,
      role: "BUYER",
      buyerProfile: {
        create: {
          address: "Lagos Port Terminal, Pier 4, Apapa",
          state: "Lagos State",
          lga: "Apapa",
        },
      },
      addresses: {
        create: [
          {
            label: "Apapa Port Warehouse",
            recipientName: "Marcus Vance (Procurement Lead)",
            phoneNumber: "+2348098765432",
            addressLine: "Berth 12, Lagos Port Complex, Wharf Road",
            city: "Apapa",
            state: "Lagos State",
            lga: "Apapa",
            postalCode: "101241",
            isDefault: true,
          },
          {
            label: "Ikeja Distribution Hub",
            recipientName: "AgroLogistics Receivables Desk",
            phoneNumber: "+2348123456789",
            addressLine: "14 Mobolaji Bank Anthony Way, Maryland",
            city: "Ikeja",
            state: "Lagos State",
            lga: "Ikeja",
            postalCode: "100271",
            isDefault: false,
          },
          {
            label: "Abuja Cold-Chain Terminal",
            recipientName: "Northern Procurement Center",
            phoneNumber: "+2348055551234",
            addressLine: "Plot 88 Industrial Zone, Phase II",
            city: "Idu",
            state: "Abuja FCT",
            lga: "Abuja Municipal",
            postalCode: "900110",
            isDefault: false,
          },
        ],
      },
    },
    include: { buyerProfile: true },
  });

  const farmer1Id = farmerUser1.farmerProfile!.id;
  const farmer2Id = farmerUser2.farmerProfile!.id;
  const farmer3Id = farmerUser3.farmerProfile!.id;

  // 5. Seed Categories
  const categoryGrains = await prisma.category.upsert({
    where: { name: "Grains & Seeds" },
    update: {},
    create: { name: "Grains & Seeds", description: "Sesame, Maize, Rice, Sorghum" },
  });

  const categoryNuts = await prisma.category.upsert({
    where: { name: "Tree Nuts" },
    update: {},
    create: { name: "Tree Nuts", description: "Raw Cashew Nuts, Sheanuts" },
  });

  const categorySpices = await prisma.category.upsert({
    where: { name: "Spices & Herbs" },
    update: {},
    create: { name: "Spices & Herbs", description: "Split Ginger, Hibiscus (Zobo), Turmeric" },
  });

  const categoryTubers = await prisma.category.upsert({
    where: { name: "Tubers & Roots" },
    update: {},
    create: { name: "Tubers & Roots", description: "Export Grade Yam, Cassava Flour (HQCF)" },
  });

  // 6. Seed Commodities / Products (Approved & Pending Moderation)
  const productsData = [
    {
      name: "Premium Natural White Sesame Seeds",
      farmerProfileId: farmer1Id,
      categoryId: categoryGrains.id,
      description: "Cleaned natural white sesame seeds, 99.5% purity minimum, max 6% moisture. Sourced directly from Kano and Jigawa state co-ops.",
      price: 1850000.00,
      unit: "TON" as const,
      status: "APPROVED" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1608797178974-15b35a64ede0?auto=format&fit=crop&q=80&w=800",
      availableQty: 250,
    },
    {
      name: "Sun-Dried Split Ginger (Grade A)",
      farmerProfileId: farmer1Id,
      categoryId: categorySpices.id,
      description: "Clean split ginger root, dark brown / golden skin, moisture content under 9%, total ash under 8%. Ready for container shipping.",
      price: 2400000.00,
      unit: "TON" as const,
      status: "APPROVED" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800",
      availableQty: 120,
    },
    {
      name: "Export Grade Abuja White Yam Tubers",
      farmerProfileId: farmer2Id,
      categoryId: categoryTubers.id,
      description: "Hand-selected tuber weights between 2.5kg to 4.0kg. Cleaned, treated against spoilage, packaged in ventilated wooden crates.",
      price: 750000.00,
      unit: "TON" as const,
      status: "APPROVED" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1596450514735-2287c8052458?auto=format&fit=crop&q=80&w=800",
      availableQty: 300,
    },
    {
      name: "High Quality Cassava Flour (HQCF 50kg Bags)",
      farmerProfileId: farmer2Id,
      categoryId: categoryTubers.id,
      description: "Unfermented, smooth white flour processed from fresh cassava tubers within 24 hours of harvest. Ideal for industrial baking.",
      price: 42000.00,
      unit: "BAG" as const,
      status: "APPROVED" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
      availableQty: 800,
    },
    {
      name: "Fermented Organic Cocoa Beans (Grade 1)",
      farmerProfileId: farmer3Id,
      categoryId: categorySpices.id,
      description: "Sun-cured fermented beans, slate count under 3%, moldy count under 3%. Sourced from Ondo and Cross River state plantations.",
      price: 3100000.00,
      unit: "TON" as const,
      status: "APPROVED" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1585849835108-72b647ec86f8?auto=format&fit=crop&q=80&w=800",
      availableQty: 80,
    },
    {
      name: "Raw Cashew Nuts (KOR 52lbs)",
      farmerProfileId: farmer3Id,
      categoryId: categoryNuts.id,
      description: "Ogbomoso and Kogi origin Raw Cashew Nuts (RCN). Nut count 180-200/kg, Kernel Outturn Ratio (KOR) 50-52 lbs.",
      price: 1420000.00,
      unit: "TON" as const,
      status: "APPROVED" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&q=80&w=800",
      availableQty: 500,
    },
    // Seed a PENDING_APPROVAL crop for the Admin Moderation Queue
    {
      name: "Dried Hibiscus Flowers (Dark Red Zobo)",
      farmerProfileId: farmer1Id,
      categoryId: categorySpices.id,
      description: "Whole calyx dark red dried hibiscus flower petals, pesticide residue free, moisture under 12%. Awaiting platform compliance approval.",
      price: 980000.00,
      unit: "TON" as const,
      status: "PENDING_APPROVAL" as const,
      isAvailable: false,
      imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=800",
      availableQty: 150,
    },
  ];

  for (const item of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      const createdProduct = await prisma.product.create({
        data: {
          farmerProfileId: item.farmerProfileId,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          unit: item.unit,
          status: item.status,
          isAvailable: item.isAvailable,
          images: {
            create: [{ imageUrl: item.imageUrl }],
          },
          inventory: {
            create: { availableQty: item.availableQty },
          },
        },
      });
      console.log(`  ✓ Product seeded: ${createdProduct.name} [${createdProduct.status}]`);
    }
  }

  console.log("✅ Database seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
