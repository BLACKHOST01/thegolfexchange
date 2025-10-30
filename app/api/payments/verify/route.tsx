import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { txId, txHash } = await req.json();

    const transaction = await prisma.transaction.findUnique({
      where: { id: txId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Update to mark payment as complete
    const updated = await prisma.transaction.update({
      where: { id: txId },
      data: { status: "confirmed", txHash },
    });

    // Optionally mark order as paid
    if (updated.orderId) {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json({
      message: "Transaction confirmed successfully",
      transaction: updated,
    });
  } catch (err) {
    console.error("Verify Error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
