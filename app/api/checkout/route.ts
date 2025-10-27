import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/checkout
 * Process checkout for both authenticated users and guests
 */
export async function POST(req: Request) {
  try {
    const { 
      items, 
      shippingAddress, 
      notes,
      customerInfo, // Add customerInfo for guest orders
      isGuest = true // Default to guest since frontend uses guest system
    } = await req.json();

    // Validate request body
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing items array" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Missing shipping address" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return NextResponse.json(
          { error: "Missing productId or quantity in one or more items" },
          { status: 400 }
        );
      }
      
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Quantity must be greater than 0" },
          { status: 400 }
        );
      }
    }

    // Calculate total amount from items
    const totalAmount = items.reduce((total: number, item: any) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Generate order number
    const orderNumber = `TGE-${Date.now().toString().slice(-6)}`;

    // Create order data object
    const orderData: any = {
      orderNumber, // Add order number
      totalAmount,
      status: OrderStatus.PAID, // Use PAID since frontend marks as paid
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      },
      shippingAddress: {
        create: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode
        }
      }
    };

    // For authenticated users, add buyerId
    const userId = req.headers.get("x-user-id");
    if (userId) {
      orderData.buyerId = userId;
      
      // Clear user's cart if they're authenticated
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
      });
      
      if (cart && cart.items.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });
      }
    }

    // Add notes if provided
    if (notes && Array.isArray(notes)) {
      orderData.notes = {
        create: notes.map((note: any) => ({
          content: note.content || note,
          type: note.type || 'CUSTOMER'
        }))
      };
    }

    // Create order
    const order = await prisma.order.create({
      data: orderData,
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                images: true,
                condition: true
              }
            }
          }
        },
        shippingAddress: true,
        notes: true
      }
    });

    return NextResponse.json({
      message: "Order created successfully",
      order: {
        id: order.id,
        orderNumber: (order as any).orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items,
        shippingAddress: order.shippingAddress,
        notes: order.notes
      }
    });

  } catch (err) {
    console.error("POST /api/checkout error:", err);
    return NextResponse.json(
      { error: "Checkout failed" },
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
    const status = searchParams.get('status');

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
                condition: true
              }
            }
          }
        },
        shippingAddress: true,
        notes: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ orders });
  } catch (err) {
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
    const orderId = searchParams.get('id');
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
          buyerId: userId 
        }
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
                condition: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });

  } catch (err) {
    console.error("PATCH /api/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}