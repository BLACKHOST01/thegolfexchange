import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

// ✅ GET /api/orders
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    // Build the where clause using Prisma types
    const where: Prisma.OrderWhereInput = {};

    // Add search conditions
    if (search) {
      where.OR = [
        { buyer: { name: { contains: search, mode: "insensitive" } } },
        { buyer: { email: { contains: search, mode: "insensitive" } } },
        { items: { some: { product: { title: { contains: search, mode: "insensitive" } } } } },
      ];
    }

    // Add status filter
    if (status && status !== "ALL") {
      if (Object.values(OrderStatus).includes(status as OrderStatus)) {
        where.status = status as OrderStatus;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: {
                  select: {
                    id: true,
                    name: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            provider: true,
            status: true,
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// ✅ POST /api/orders
export const POST = withAuth(async (req: AuthRequest) => {
  try {
    const { items, totalAmount, shippingAddress, notes } = await req.json();

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Valid total amount is required" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Check product availability and validate items
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, title: true }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    // Create order within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          totalAmount,
          buyerId: req.user!.id,
          items: {
            create: items.map((item: any) => ({
              quantity: item.quantity,
              price: item.price,
              productId: item.productId,
            })),
          },
          shippingAddress: {
            create: {
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode || shippingAddress.zipCode,
              country: shippingAddress.country || "Nigeria",
            },
          },
          notes: notes && notes.length > 0 ? {
            create: notes.map((note: any) => ({
              content: note.content,
              type: note.type || "CUSTOMER",
              authorId: req.user!.id,
            })),
          } : undefined,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                },
              },
            },
          },
          shippingAddress: true,
          notes: true,
        },
      });

      // Update product stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    
    // Handle specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Order constraint violation" },
        { status: 400 }
      );
    }

    if (error.message?.includes("insufficient stock")) {
      return NextResponse.json(
        { error: "Insufficient stock for one or more products" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
});