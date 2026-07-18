import { PrismaClient } from "../src/generated/prisma/client";
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

  // 3. Seed Farmer User & Profile
  const farmerUser = await prisma.user.upsert({
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

  // 4. Seed Buyer User & Profile
  const buyerUser = await prisma.user.upsert({
    where: { email: "buyer@smarthubagro.com" },
    update: {},
    create: {
      fullName: "Marcus Vance",
      email: "buyer@smarthubagro.com",
      phoneNumber: "+14155550199",
      password: hashedPassword,
      role: "BUYER",
      buyerProfile: {
        create: {
          address: "Rotterdam Export Harbor, Pier 4",
          state: "South Holland",
          lga: "Rotterdam",
        },
      },
    },
    include: { buyerProfile: true },
  });

  const farmerProfileId = farmerUser.farmerProfile!.id;

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

  // 6. Seed Commodities / Products
  const productsData = [
    {
      name: "Premium Natural White Sesame Seeds",
      categoryId: categoryGrains.id,
      description: "Cleaned natural white sesame seeds, 99.5% purity minimum, max 6% moisture. Sourced directly from Kano and Jigawa state co-ops.",
      price: 1850.00, // $ per Ton
      unit: "TON" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1608797178974-15b35a64ede0?auto=format&fit=crop&q=80&w=800",
      availableQty: 250,
    },
    {
      name: "Sun-Dried Split Ginger (Grade A)",
      categoryId: categorySpices.id,
      description: "Clean split ginger root, dark brown / golden skin, moisture content under 9%, total ash under 8%. Ready for container shipping.",
      price: 2400.00,
      unit: "TON" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800",
      availableQty: 120,
    },
    {
      name: "Raw Cashew Nuts (KOR 52lbs)",
      categoryId: categoryNuts.id,
      description: "Ogbomoso and Kogi origin Raw Cashew Nuts (RCN). Nut count 180-200/kg, Kernel Outturn Ratio (KOR) 50-52 lbs.",
      price: 1420.00,
      unit: "TON" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&q=80&w=800",
      availableQty: 500,
    },
    {
      name: "Fermented Organic Cocoa Beans (Grade 1)",
      categoryId: categorySpices.id,
      description: "Sun-cured fermented beans, slate count under 3%, moldy count under 3%. Sourced from Ondo and Cross River state plantations.",
      price: 3100.00,
      unit: "TON" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1585849835108-72b647ec86f8?auto=format&fit=crop&q=80&w=800",
      availableQty: 80,
    },
    {
      name: "Export Grade Abuja White Yam Tubers",
      categoryId: categoryTubers.id,
      description: "Hand-selected tuber weights between 2.5kg to 4.0kg. Cleaned, treated against spoilage, packaged in ventilated wooden crates.",
      price: 750.00,
      unit: "TON" as const,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1596450514735-2287c8052458?auto=format&fit=crop&q=80&w=800",
      availableQty: 300,
    },
  ];

  for (const item of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      const createdProduct = await prisma.product.create({
        data: {
          farmerProfileId,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          unit: item.unit,
          isAvailable: item.isAvailable,
          images: {
            create: [{ imageUrl: item.imageUrl }],
          },
          inventory: {
            create: { availableQty: item.availableQty },
          },
        },
      });
      console.log(`  ✓ Product seeded: ${createdProduct.name}`);
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
