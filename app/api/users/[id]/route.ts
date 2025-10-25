import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().optional().nullable(),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isVerified: z.boolean().optional(),
});

// ✅ GET /api/users/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// ✅ PUT /api/users/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate input
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = { ...validationResult.data };

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
      data.email = data.email.toLowerCase().trim();
    }

    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    // Clean name if provided
    if (data.name) {
      data.name = data.name.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);

    // Handle Prisma specific errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// ✅ DELETE /api/users/[id] - Safe approach (checks for related records)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for all related records
    const [
      cart,
      products,
      orders,
      reviews,
      sentMessages,
      receivedMessages
    ] = await Promise.all([
      prisma.cart.findMany({
        where: { userId: id },
        select: { id: true }
      }),
      prisma.product.findMany({
        where: { sellerId: id },
        select: { id: true, title: true }
      }),
      prisma.order.findMany({
        where: { buyerId: id },
        select: { id: true }
      }),
      prisma.review.findMany({
        where: { userId: id },
        select: { id: true }
      }),
      prisma.message.findMany({
        where: { senderId: id },
        select: { id: true }
      }),
      prisma.message.findMany({
        where: { receiverId: id },
        select: { id: true }
      })
    ]);

    const hasRelatedRecords = 
      cart.length > 0 || 
      products.length > 0 || 
      orders.length > 0 || 
      reviews.length > 0 || 
      sentMessages.length > 0 || 
      receivedMessages.length > 0;

    if (hasRelatedRecords) {
      return NextResponse.json(
        { 
          error: "Cannot delete user with existing records",
          details: {
            cart: cart.length,
            products: products.length,
            orders: orders.length,
            reviews: reviews.length,
            sentMessages: sentMessages.length,
            receivedMessages: receivedMessages.length,
            // Show product titles for better context
            productTitles: products.map(p => p.title).slice(0, 5) // Show first 5 titles
          },
          suggestion: "Please delete or transfer all related records before deleting this user."
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle foreign key constraints
    if (error.code === "P2003") {
      return NextResponse.json(
        { 
          error: "Cannot delete user with existing records",
          suggestion: "Please delete all related cart items, products, orders, reviews, and messages first."
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}