import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/products/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        images: true, // ✅ ADD THIS LINE - include images relation
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        category: true, // ✅ Also include category if needed
        subcategory: true, // ✅ And subcategory if needed
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
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await req.json();

    const parsedData: any = {
      title: data.title,
      description: data.description,
      price: data.price ? Number(data.price) : undefined,
      stock: data.stock ? Number(data.stock) : undefined,
      condition: data.condition,
      location: data.location,
      isFeatured: data.isFeatured ?? false,
      isUsed: data.isUsed ?? false,
      rating: data.rating ? Number(data.rating) : undefined,
      sellerId: data.sellerId,
      // Remove the images assignment here since it's handled by relations
    };

    if (data.categoryId) {
      parsedData.category = { connect: { id: data.categoryId } };
    } else if (data.category === null) {
      parsedData.category = { disconnect: true };
    }

    if (data.subcategoryId) {
      parsedData.subcategory = { connect: { id: data.subcategoryId } };
    } else if (data.subcategory === null) {
      parsedData.subcategory = { disconnect: true };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: parsedData,
      include: {
        category: true,
        subcategory: true,
        seller: true,
        reviews: true,
        images: true, // ✅ Include images in the response
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}