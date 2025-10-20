import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/products
 * Supports pagination via ?page=1&limit=6
 * Supports search via ?search=keyword
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // ✅ Type-safe where filter
    const where: Prisma.ProductWhereInput = search
      ? {
          title: {
            contains: search,
            mode: "insensitive", // TypeScript now knows this is valid
          },
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: { seller: true },
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const newProduct = await prisma.product.create({ data });
    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
