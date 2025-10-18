// /app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    // body can contain paymentProvider info in advanced flows

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0)
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    // compute total
    const totalAmount = cart.items.reduce(
      (s, it) => s + it.quantity * it.product.price,
      0
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        totalAmount,
        status: OrderStatus.PENDING,
        buyerId: userId,
        items: {
          create: cart.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.product.price,
          })),
        },
      },
      include: { items: true },
    });

    // create a placeholder transaction (update after provider callback)
    const tx = await prisma.transaction.create({
      data: {
        amount: order.totalAmount,
        currency: "NGN",
        provider: "paystack",
        providerRef: `TXN-${faker.string.alphanumeric(6).toUpperCase()}`,
        status: "SUCCESS",
        orderId: order.id,
      },
    });

    // Optionally: if using an offline payment or already confirmed payment:
    // await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID }});

    // clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json({ order, transaction: tx });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
