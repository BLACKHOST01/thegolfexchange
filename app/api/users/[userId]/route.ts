// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

interface UserUpdateData {
  name: string;
  email: string;
  phone?: string;
  role: Role; // Use the Role enum from Prisma
  isVerified: boolean;
  avatar?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    console.log("Fetching user with ID:", userId);

    // Fetch actual user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user:", user);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const updateData: UserUpdateData = await request.json();

    console.log("Updating user:", userId, "with data:", updateData);

    // Validate required fields
    if (!updateData.name || !updateData.email || !updateData.role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, and role are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(Role).includes(updateData.role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already taken by another user" },
          { status: 400 }
        );
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name.trim(),
        email: updateData.email.trim(),
        phone: updateData.phone?.trim() || null,
        role: updateData.role,
        isVerified: updateData.isVerified,
        avatar: updateData.avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log("User updated successfully:", updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    console.log("Deleting user:", userId);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for related records that would prevent deletion
    const relatedRecords = await prisma.$transaction([
      prisma.cart.count({ where: { userId } }),
      prisma.product.count({ where: { sellerId: userId } }),
      prisma.order.count({ where: { buyerId: userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.message.count({ 
        where: { 
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      }),
    ]);

    const [cartItems, products, orders, reviews, messages] = relatedRecords;

    // If there are related records, return error with details
    if (cartItems > 0 || products > 0 || orders > 0 || reviews > 0 || messages > 0) {
      const productTitles = products > 0 ? await prisma.product.findMany({
        where: { sellerId: userId },
        select: { title: true },
        take: 3
      }).then(products => products.map(p => p.title)) : [];

      return NextResponse.json({
        error: "Cannot delete user with existing related records",
        details: {
          cart: cartItems,
          products,
          orders,
          reviews,
          sentMessages: messages, // This includes both sent and received
          receivedMessages: messages,
          productTitles
        }
      }, { status: 400 });
    }

    // Delete user (will cascade to related records that are allowed to be deleted)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log("User deleted successfully:", userId);
    return NextResponse.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}