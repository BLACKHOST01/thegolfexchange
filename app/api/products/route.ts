import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * ✅ Helper: extract user from cookie JWT
 */
const getUserFromCookie = (req: Request): { id: string; role: string } | null => {
  try {
    const cookies = cookie.parse(req.headers.get("cookie") || "");
    const token = cookies.token;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * ✅ GET /api/products
 * Supports pagination, search, and public listing
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const where: Prisma.ProductWhereInput = search
      ? { title: { contains: search, mode: "insensitive" } }
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
 * ✅ POST /api/products
 * Requires valid JWT cookie (set during login)
 */
export async function POST(req: Request) {
  try {
    // 1️⃣ Verify user from cookie
    const user = getUserFromCookie(req);
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Parse product data
    const data = await req.json();

    // 3️⃣ Create product
    const newProduct = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        condition: data.condition,
        images: data.images || [],
        stock: data.stock ?? 1,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
        isUsed: data.isUsed ?? false,
        isFeatured: data.isFeatured ?? false,
        rating: 0,
        location: data.location || null,
        sellerId: user.id, // ✅ Comes from JWT
      },
      include: { seller: true },
    });

    return NextResponse.json(newProduct);
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid seller ID (user not found or unauthorized)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
