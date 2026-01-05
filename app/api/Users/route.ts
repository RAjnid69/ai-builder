import { NextResponse } from "next/server";
import { AppDataSource } from "@/lib/db/data-source";
import { User } from "@/lib/db/entities/User";
import bcrypt from "bcryptjs";

/** 
 * GET /api/users
 * Returns all users
 */
export async function GET() {
  try {
    const db = await AppDataSource();
    const userRepo = db.getRepository(User);

    const users = await userRepo.find({
      select: ["id", "email", "role", "createdAt", "updatedAt"], // no password
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Creates a new user (Signup)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await AppDataSource();
    const userRepo = db.getRepository(User);

    const existing = await userRepo.findOne({
      where: { email: body.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = userRepo.create({
      email: body.email,
      password: hashedPassword,
      role: body.role ?? "user",
    });

    await userRepo.save(user);

    // Strip password before returning
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
