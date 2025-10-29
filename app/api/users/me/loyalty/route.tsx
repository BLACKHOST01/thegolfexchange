import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Fixed import

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate loyalty points based on orders
    const orders = await prisma.order.findMany({
      where: {
        buyerId: user.id,
        status: "DELIVERED",
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Fixed TypeScript: Added proper types to reduce parameters
    const totalSpent = orders.reduce(
      (sum: number, order: { totalAmount: number }) => sum + order.totalAmount,
      0
    );

    // Calculate points: 1 point per $10 spent
    const totalPoints = Math.floor(totalSpent / 10);
    const usedPoints = 0;
    const availablePoints = totalPoints - usedPoints;

    // Determine loyalty level
    let level = "Bronze";
    let nextLevel = "Silver";
    let progress = 0;

    if (totalSpent >= 1000) {
      level = "Gold";
      nextLevel = "Platinum";
      progress = 100;
    } else if (totalSpent >= 500) {
      level = "Silver";
      nextLevel = "Gold";
      progress = Math.min(100, ((totalSpent - 500) / 500) * 100);
    } else {
      progress = Math.min(100, (totalSpent / 500) * 100);
    }

    const loyaltyData = {
      total: totalPoints,
      available: availablePoints,
      used: usedPoints,
      level,
      nextLevel,
      progress: Math.round(progress),
    };

    return NextResponse.json(loyaltyData);
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
