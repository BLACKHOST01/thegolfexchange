// /app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const { productId, rating, comment } = await req.json();
    if (!productId || typeof rating !== "number")
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Basic validation: rating 1-5
    if (rating < 1 || rating > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 });

    const review = await prisma.review.create({
      data: { productId, userId, rating, comment },
    });

    return NextResponse.json(review);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
