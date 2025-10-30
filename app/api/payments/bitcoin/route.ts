// app/api/payments/bitcoin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Get session but don't require authentication
    const session = await getServerSession(authOptions);
    let user = null;

    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
    }

    const { amount, orderId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Validate order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        // Include shippingAddress to get guest email if needed
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // For authenticated users, verify order ownership using buyerId
    if (user && order.buyerId !== user.id) {
      return NextResponse.json({ error: "Order access denied" }, { status: 403 });
    }

    // For guest orders, check if there's a shipping address with email
    // or use a different method to validate guest orders
    if (!user && !order.buyerId) {
      // This is a guest order, we can proceed
      // You might want additional validation here based on your business logic
    }

    const walletAddr = process.env.BITCOIN_WALLET_ADDRESS!;
    const currency = "BTC";

    // Create Transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        currency,
        status: "pending",
        walletAddr,
        orderId,
        userId: user?.id || null,
      },
    });

    return NextResponse.json({
      message: "Send Bitcoin to the wallet below",
      walletAddr,
      network: process.env.BITCOIN_NETWORK || "mainnet",
      transactionId: transaction.id,
      userId: user?.id || "guest",
    });
  } catch (err) {
    console.error("BTC Payment Error:", err);
    return NextResponse.json({ error: "Payment setup failed" }, { status: 500 });
  }
}