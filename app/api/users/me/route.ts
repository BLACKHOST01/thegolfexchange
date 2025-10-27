import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

// GET /api/users/me - Get current user profile
export const GET = withAuth(async (req: AuthRequest) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
});

// PUT /api/users/me - Update user profile
export const PUT = withAuth(async (req: AuthRequest) => {
  try {
    const { name, email, phone } = await req.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: req.user!.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already taken" },
        { status: 409 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email is already taken" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
});