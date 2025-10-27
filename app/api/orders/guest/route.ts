// app/api/orders/guest/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, OrderStatus, NoteType } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface GuestOrderInput {
  orderNumber: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
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

export async function POST(req: Request) {
  try {
    const data: GuestOrderInput = await req.json();

    // Basic validation
    if (!data.orderNumber || !data.customerInfo?.email || !data.items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: orderNumber, customerInfo.email, items' },
        { status: 400 }
      );
    }

    // First, check if we need to add orderNumber field to your schema
    // For now, we'll check if an order with this number already exists using findFirst
    const existingOrder = await prisma.order.findFirst({
      where: { 
        // Since orderNumber doesn't exist in your schema, we can't use it directly
        // We'll need to track order numbers differently or add the field to schema
        id: data.orderNumber // Using ID as fallback, but you should add orderNumber to schema
      }
    });

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Order already exists' },
        { status: 409 }
      );
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
        role: 'USER',
      },
    });

    // Create the order
    const order = await prisma.order.create({
      data: {
        // Note: Your current schema doesn't have orderNumber field
        // You'll need to add it to the Order model or use a different approach
        totalAmount: data.totalAmount,
        status: data.status,
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
            postalCode: data.shippingAddress.zipCode, // Map zipCode to postalCode
            country: data.shippingAddress.country,
          }
        },
        notes: data.notes && data.notes.length > 0 ? {
          create: data.notes.map((note) => ({
            content: note.content,
            type: (note.type as NoteType) || NoteType.CUSTOMER, // Default to CUSTOMER
            authorId: guestUser.id, // Set the author of the note
          })),
        } : undefined,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true, // Use 'title' instead of 'name'
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
      message: 'Guest order created successfully',
      order,
    });
  } catch (error) {
    console.error('Failed to create guest order:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Order already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create guest order' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const orderId = searchParams.get('orderId'); // Using orderId since orderNumber doesn't exist

    if (!email && !orderId) {
      return NextResponse.json(
        { error: 'Email or order ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (orderId) {
      whereClause.id = orderId;
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
                title: true, // Use 'title' instead of 'name'
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch guest orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest orders' },
      { status: 500 }
    );
  }
}