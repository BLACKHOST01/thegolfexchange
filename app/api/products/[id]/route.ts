import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/products/[id]
 * Fetch a single product and its reviews
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
/**
 * PUT /api/products/[id]
 * Update product details
 */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const data = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}