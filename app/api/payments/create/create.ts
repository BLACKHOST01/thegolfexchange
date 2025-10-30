import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, handleApiError, AppError } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const { amount } = await req.json();

    if (!amount || amount <= 0) throw new AppError("Invalid amount", 400);

    const btcAddress = process.env.BITCOIN_WALLET_ADDRESS;
    if (!btcAddress) throw new AppError("Bitcoin wallet address not configured", 500);

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        currency: "BTC",
        provider: "Manual Bitcoin",
        status: "pending",
        walletAddr: btcAddress,
      },
    });

    return NextResponse.json({
      message: "Send Bitcoin to the address below to complete payment.",
      address: btcAddress,
      transactionId: tx.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
