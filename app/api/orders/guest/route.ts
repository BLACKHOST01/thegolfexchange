// app/api/orders/guest/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus, NoteType } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

interface GuestOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status?: OrderStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  notes?: Array<{
    content: string;
    type: string;
  }>;
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export async function POST(req: Request) {
  try {
    const data: GuestOrderInput = await req.json();

    // Basic validation
    if (!data.customerInfo?.email || !data.items?.length) {
      return NextResponse.json(
        {
          error: "Missing required fields: customerInfo.email, items",
        },
        { status: 400 }
      );
    }

    // Generate order number
    let orderNumber = generateOrderNumber();

    // Check if order number already exists (unlikely but safe)
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existingOrder) {
      // Regenerate if collision occurs
      orderNumber = generateOrderNumber();
    }

    // Create or connect to guest user
    const guestUser = await prisma.user.upsert({
      where: { email: data.customerInfo.email },
      update: {
        name: `${data.customerInfo.firstName} ${data.customerInfo.lastName}`,
        phone: data.customerInfo.phone,
      },
      create: {
        email: data.customerInfo.email,
        name: `${data.customerInfo.firstName} ${data.customerInfo.lastName}`,
        password: randomUUID(),
        phone: data.customerInfo.phone,
        isVerified: false,
        role: "USER",
      },
    });

    // Create the order WITH orderNumber
    const order = await prisma.order.create({
      data: {
        orderNumber, // Add this required field
        totalAmount: data.totalAmount,
        status: data.status || 'PENDING',
        buyerId: guestUser.id,
        items: {
          create: data.items.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
          })),
        },
        shippingAddress: {
          create: {
            street: data.shippingAddress.street,
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            postalCode: data.shippingAddress.zipCode,
            country: data.shippingAddress.country,
          },
        },
        notes:
          data.notes && data.notes.length > 0
            ? {
                create: data.notes.map((note) => ({
                  content: note.content,
                  type: (note.type as NoteType) || NoteType.CUSTOMER,
                  authorId: guestUser.id,
                })),
              }
            : undefined,
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
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Guest order created successfully",
      order,
    });
  } catch (error) {
    console.error("Failed to create guest order:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint") || error.message.includes("orderNumber")) {
        return NextResponse.json(
          { error: "Order number already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create guest order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber"); // New parameter

    if (!email && !orderId && !orderNumber) {
      return NextResponse.json(
        { error: "Email, order ID, or order number is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (orderId) {
      whereClause.id = orderId;
    }

    if (orderNumber) {
      whereClause.orderNumber = orderNumber;
    }

    if (email) {
      whereClause.buyer = { email };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
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
              },
            },
          },
        },
        shippingAddress: true,
        notes: {
          where: {
            type: { not: NoteType.INTERNAL },
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch guest orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest orders" },
      { status: 500 }
    );
  }
}