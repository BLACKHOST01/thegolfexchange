// app/api/products/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * Helper: extract token from Authorization header or cookie
 */
const extractTokenFromReq = (req: Request): string | null => {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  return cookies.token || null;
};

/**
 * Helper: verify token and return payload (or null)
 */
const verifyToken = (token: string | null): { id: string; role?: string } | null => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (err) {
    return null;
  }
};

/**
 * Helper: normalize images field to string[]
 */
const normalizeImages = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    // try JSON parse first
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fallback to comma separated
      return (raw as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

/**
 * GET /api/products
 * Public listing with pagination & search
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "6")));
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

    // normalize images for each product (optional but helpful)
    const normalized = products.map((p) => ({
      ...p,
      images: normalizeImages(p.images),
    }));

    return NextResponse.json({
      products: normalized,
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
 * Create a product. Requires valid token via cookie or Authorization header.
 * During development, you may set DEV_BYPASS=true and DEV_ADMIN_ID="<id>"
 * to bypass auth (useful for local testing only).
 */
export async function POST(req: Request) {
  try {
    // attempt token from header or cookie
    const token = extractTokenFromReq(req);
    let user = verifyToken(token);

    // dev bypass (ONLY if not production and bypass explicitly enabled)
    if (!user && process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS === "true") {
      const devId = process.env.DEV_ADMIN_ID || null;
      if (devId) {
        user = { id: devId, role: "ADMIN" };
        console.warn("Using DEV_BYPASS user for product creation:", devId);
      }
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // normalize incoming images (accept array, JSON string, or comma string)
    const images = normalizeImages(body.images);

    // parse numeric fields safely
    const price = body.price !== undefined ? Number(body.price) : null;
    const stock = body.stock !== undefined ? Number(body.stock) : 1;
    const rating = body.rating !== undefined ? Number(body.rating) : 0;

    // validate some required fields (adjust as necessary)
    if (!body.title || !body.description) {
      return NextResponse.json({ error: "Missing required fields: title or description" }, { status: 400 });
    }

    // create product
    const created = await prisma.product.create({
      data: {
        title: String(body.title),
        description: String(body.description),
        price: Number.isFinite(price as number) ? (price as number) : 0,
        condition: body.condition ?? "NEW",
        images,
        stock: Number.isFinite(stock as number) ? Math.max(0, stock as number) : 1,
        categoryId: body.categoryId ?? null,
        subcategoryId: body.subcategoryId ?? null,
        isUsed: body.isUsed ?? false,
        isFeatured: body.isFeatured ?? false,
        rating: Number.isFinite(rating as number) ? rating as number : 0,
        location: body.location ?? null,
        sellerId: user.id,
      },
      include: { seller: true },
    });

    // ensure images returned as array
    const response = { ...created, images };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);

    // Prisma foreign key error (invalid seller/category ids)
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "Invalid foreign key (category/seller/subcategory)" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
