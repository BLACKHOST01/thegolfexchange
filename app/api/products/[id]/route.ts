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
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // ✅ Ensure images is always an array
    let images: string[] = [];

    const rawImages = product.images as unknown; // safely cast
    if (typeof rawImages === "string") {
      try {
        images = JSON.parse(rawImages) as string[];
      } catch {
        images = (rawImages as string).split(",").map((i: string) => i.trim());
      }
    } else if (Array.isArray(rawImages)) {
      images = rawImages as string[];
    }

    return NextResponse.json({ ...product, images });
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
      images: data.images ?? [],
      sellerId: data.sellerId,
    };

    // Handle category and subcategory relations safely
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
