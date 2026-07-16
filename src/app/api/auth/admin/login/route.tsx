import { PrismaClient, Role } from "../../../../../generated/prisma/client";

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = body;

    const admin = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          message: "Admin account not found",
        },
        {
          status: 404,
        },
      );
    }

    if (admin.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          message: "Access denied",
        },
        {
          status: 403,
        },
      );
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          message: "Invalid password",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Login successful",

        admin: {
          id: admin.id,
          name: admin.fullName,
          email: admin.email,
          role: admin.role,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Server error",
        error,
      },
      {
        status: 500,
      },
    );
  }
}
