import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const seedAdminUser = async () => {
  //salt rounds for bcrypt hashing
  const salt = bcrypt.genSaltSync(10);

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, salt);

  //create an admin user in the database
  await prisma.user.create({
    data: {
      fullName: process.env.ADMIN_NAME!,
      email: process.env.ADMIN_EMAIL!,
      phoneNumber: process.env.ADMIN_PHONE!,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created successfully");
};

seedAdminUser()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
