import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🛒 GET CART
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(cart ?? { items: [] });
  } catch (error) {
    console.error("GET /cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// ➕ ADD ITEM TO CART
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const { productId, quantity = 1 } = await req.json();
    if (!productId)
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // 🧩 Ensure user exists (fix for P2003)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: "Guest User",
          email: `${userId}@guest.local`,
          password: "guest-password", // 🔥 added to satisfy Prisma type
        },
      });
    }

    // 🧩 Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // 🧩 Add or update item
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    let updatedItem;
    if (existing) {
      updatedItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: true },
      });
    } else {
      updatedItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: true },
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("POST /cart error:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// ✏️ UPDATE ITEM QUANTITY
export async function PUT(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const { cartItemId, quantity } = await req.json();
    if (!cartItemId || typeof quantity !== "number")
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId)
      return NextResponse.json(
        { error: "Unauthorized or not found" },
        { status: 403 }
      );

    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /cart error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// ❌ REMOVE ITEM FROM CART
export async function DELETE(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get("id");
    const body = await req.json().catch(() => ({}));
    const cartItemId = idFromQuery ?? body.cartItemId;

    if (!cartItemId)
      return NextResponse.json(
        { error: "Missing cartItemId" },
        { status: 400 }
      );

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId)
      return NextResponse.json(
        { error: "Unauthorized or not found" },
        { status: 403 }
      );

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return NextResponse.json({ message: "Item removed" });
  } catch (error) {
    console.error("DELETE /cart error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
