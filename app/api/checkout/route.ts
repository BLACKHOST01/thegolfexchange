import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/cart
 * Add a product to the user's cart
 */
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const { productId, quantity } = await req.json();

    if (!productId || !quantity)
      return NextResponse.json(
        { error: "Missing productId or quantity" },
        { status: 400 }
      );

    // find or create cart for this user
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // check if product already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      // update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // add new item
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return NextResponse.json({ message: "Added to cart successfully" });
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

/**
 * GET /api/cart
 * Retrieve all items in the user's cart
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart)
      return NextResponse.json({ items: [] });

    return NextResponse.json(cart);
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

/**
 * DELETE /api/cart
 * Clear all items from the user's cart
 */
export async function DELETE(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart)
      return NextResponse.json({ message: "Cart already empty" });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
