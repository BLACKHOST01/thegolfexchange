import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

export const POST = withAuth(async (req: AuthRequest) => {
  try {
    const { title, description, price, categoryId, stock, location } = await req.json();

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        categoryId,
        stock,
        location: location || "Lagos, Nigeria",
        sellerId: req.user!.id,
        condition: "NEW",
        isFeatured: false,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
});