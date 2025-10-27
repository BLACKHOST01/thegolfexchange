import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/checkout
 * Process checkout and create order
 */
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const { items, provider, shippingAddress, notes } = await req.json();

    // Validate request body
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing items array" },
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
      
      // Validate quantity is positive
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Quantity must be greater than 0" },
          { status: 400 }
        );
      }
    }

    // Get user's cart with items and products
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { 
            product: true 
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Verify all requested items exist in cart and have valid product data
    const cartItemsMap = new Map();
    cart.items.forEach(item => {
      cartItemsMap.set(item.productId, item);
    });

    const invalidCartItems = [];
    const orderItemsData = [];

    for (const requestedItem of items) {
      const cartItem = cartItemsMap.get(requestedItem.productId);
      
      if (!cartItem) {
        invalidCartItems.push(`Product ${requestedItem.productId} not found in cart`);
        continue;
      }

      if (!cartItem.product) {
        invalidCartItems.push(`Product data missing for ${requestedItem.productId}`);
        continue;
      }

      if (cartItem.quantity !== requestedItem.quantity) {
        invalidCartItems.push(`Quantity mismatch for product ${requestedItem.productId}`);
        continue;
      }

      orderItemsData.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price
      });
    }

    if (invalidCartItems.length > 0) {
      return NextResponse.json(
        { error: `Cart validation failed: ${invalidCartItems.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate total amount from actual cart items
    const totalAmount = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    // Create order data object
    const orderData: any = {
      buyerId: userId,
      totalAmount,
      status: OrderStatus.PENDING, // Using the enum
      items: {
        create: orderItemsData.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    };

    // Add shipping address if provided
    if (shippingAddress) {
      orderData.shippingAddress = {
        create: shippingAddress
      };
    }

    // Add notes if provided
    if (notes && Array.isArray(notes)) {
      orderData.notes = {
        create: notes.map((note: string) => ({
          content: note
        }))
      };
    }

    // Create order using your schema
    const order = await prisma.order.create({
      data: orderData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        shippingAddress: true,
        notes: true
      }
    });

    // Clear the cart after successful order creation
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return NextResponse.json({
      message: "Order created successfully",
      orderId: order.id,
      totalAmount,
      status: order.status,
      items: order.items,
      shippingAddress: order.shippingAddress,
      notes: order.notes
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
 * Get user's order history
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
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
            product: true
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
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');
    const { status } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify the order belongs to the user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        buyerId: userId 
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true
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