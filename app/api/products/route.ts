// app/api/products/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma, UploadedFile } from "@prisma/client";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * Extract token from Authorization header or cookie
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
 * Verify token and return payload
 */
const verifyToken = (
  token: string | null
): { id: string; role?: string } | null => {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
};

/**
 * Normalize images field to string[]
 */
const normalizeImages = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
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
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "6"))
    );
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const where: Prisma.ProductWhereInput = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: {
          seller: true,
          images: true, // ✅ matches schema
        },
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // ✅ Map binary images to base64 URLs safely
    const normalized = products.map((p) => ({
      ...p,
      images: (p.images as UploadedFile[]).map((f) => ({
        name: f.name,
        mimeType: f.mimeType,
        url: `data:${f.mimeType};base64,${Buffer.from(f.data).toString(
          "base64"
        )}`,
      })),
    }));

    return NextResponse.json({
      products: normalized,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a product with image uploads stored directly in the database.
 */
export async function POST(req: Request) {
  try {
    const token = extractTokenFromReq(req);
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const condition = (formData.get("condition") as "NEW" | "USED") || "NEW";
    const stock = parseInt(formData.get("stock") as string) || 1;
    const categoryId = formData.get("categoryId") as string | null;
    const subcategoryId = formData.get("subcategoryId") as string | null;
    const files = formData.getAll("files") as File[];

    if (!title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: isNaN(price) ? 0 : price,
        condition,
        stock,
        categoryId,
        subcategoryId,
        sellerId: user.id,
      },
    });

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await prisma.uploadedFile.create({
        data: {
          name: file.name,
          mimeType: file.type,
          data: buffer,
          productId: product.id,
        },
      });
    }

    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
