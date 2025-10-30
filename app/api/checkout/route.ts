import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus, NoteType } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { items, shippingAddress, customerInfo } = await req.json();

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (
      !shippingAddress?.street ||
      !shippingAddress?.city ||
      !shippingAddress?.postalCode
    ) {
      return NextResponse.json(
        { error: "Missing shipping information" },
        { status: 400 }
      );
    }

    if (!customerInfo?.email || !customerInfo?.firstName || !customerInfo?.lastName) {
      return NextResponse.json(
        { error: "Missing customer information" },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = parseFloat(
      items
        .reduce((total: number, item: any) => {
          return total + item.price * item.quantity;
        }, 0)
        .toFixed(2)
    );

    // Generate order number
    const orderNumber = `TGE-${Date.now().toString().slice(-6)}`;

    // Create or find guest user
    const guestUser = await prisma.user.upsert({
      where: { email: customerInfo.email },
      update: {
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        phone: customerInfo.phone,
      },
      create: {
        email: customerInfo.email,
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        password: randomUUID(), // Generate random password for guest users
        phone: customerInfo.phone,
        isVerified: false,
        role: "USER",
      },
    });

    // Create order data with proper types
    const orderData = {
      orderNumber,
      totalAmount,
      status: OrderStatus.PENDING,
      buyerId: guestUser.id, // Add the required buyerId
      items: {
        create: items.map((item: any) => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      shippingAddress: {
        create: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
        },
      },
      notes: {
        create: [
          {
            content: `Guest Order - ${customerInfo.firstName} ${customerInfo.lastName}, Email: ${customerInfo.email}, Phone: ${customerInfo.phone || 'N/A'}`,
            type: NoteType.CUSTOMER,
            authorId: guestUser.id, // Set author for the note
          },
        ],
      },
    };

    console.log("Creating order...");

    // Create order with all necessary includes
    const order = await prisma.order.create({
      data: orderData,
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                images: true,
                condition: true,
              },
            },
          },
        },
        shippingAddress: true,
        notes: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log("Order created successfully:", order.id);

    return NextResponse.json({
      message: "Order created successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product,
        })),
        shippingAddress: order.shippingAddress,
        notes: order.notes,
      },
    });
  } catch (err: any) {
    console.error("POST /api/checkout error:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: "Order number already exists. Please try again." },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout/orders
 * Get user's order history (for authenticated users)
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    // If no user ID, return empty array (guest users use local storage)
    if (!userId) {
      return NextResponse.json({ orders: [] });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = { buyerId: userId };
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                images: true,
                condition: true,
              },
            },
          },
        },
        shippingAddress: true,
        notes: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ 
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product,
        })),
        shippingAddress: order.shippingAddress,
        notes: order.notes,
      }))
    });
  } catch (err: any) {
    console.error("GET /api/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/checkout/order/[id]
 * Update order status (for admin or user)
 */
export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    // Allow updates without user ID for guest orders
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    const { status } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // If user ID is provided, verify the order belongs to the user
    if (userId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          buyerId: userId,
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                images: true,
                condition: true,
              },
            },
          },
        },
        shippingAddress: true,
        notes: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Order status updated successfully",
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        totalAmount: updatedOrder.totalAmount,
        status: updatedOrder.status,
        items: updatedOrder.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product,
        })),
        shippingAddress: updatedOrder.shippingAddress,
        notes: updatedOrder.notes,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}