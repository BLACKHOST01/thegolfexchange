import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      productName: review.product.title,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
