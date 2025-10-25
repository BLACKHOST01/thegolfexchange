import { NextResponse } from "next/server";
import { PrismaClient, Prisma, UploadedFile } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * ✅ Helper functions
 */
function extractTokenFromReq(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

function verifyToken(token: string | null) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload as { id: string; role: string };
  } catch {
    return null;
  }
}

/**
 * ✅ Process files safely with proper error handling
 */
async function processFiles(files: File[], productId: string) {
  const uploadedFiles = [];

  for (const file of files) {
    // Validate file object more safely
    if (!file || typeof file !== 'object') {
      console.warn("Skipping invalid file object:", file);
      continue;
    }

    // Safe property access
    const fileName = (file as any).name;
    const fileType = (file as any).type;
    const fileSize = (file as any).size;

    if (!fileName || !fileType) {
      console.warn("Skipping file with missing name or type:", file);
      continue;
    }

    // Validate file type
    if (!fileType.startsWith('image/')) {
      console.warn(`Skipping non-image file: ${fileName}`);
      continue;
    }

    // Validate file size (5MB limit)
    if (fileSize > 5 * 1024 * 1024) {
      console.warn(`File too large: ${fileName} (${fileSize} bytes)`);
      continue;
    }

    try {
      let buffer: Buffer;
      
      // Multiple approaches to handle different file types
      if (file && typeof (file as any).arrayBuffer === 'function') {
        // Standard File object
        const arrayBuffer = await (file as any).arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else if (file instanceof Blob) {
        // Blob object
        const arrayBuffer = await new Response(file).arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        console.warn(`Unsupported file type for: ${fileName}`, {
          constructor: (file as any)?.constructor?.name,
          type: typeof file
        });
        continue;
      }

      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          name: fileName,
          mimeType: fileType,
          data: buffer,
          productId: productId,
        },
      });

      uploadedFiles.push(uploadedFile);
      console.log(`✅ Successfully uploaded: ${fileName}`);
    } catch (fileError) {
      console.error(`❌ Error processing file ${fileName}:`, fileError);
      continue;
    }
  }

  return uploadedFiles;
}

/**
 * ✅ Normalize images
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
 * ✅ GET /api/products - FIXED VERSION
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "100"))); // Increased default limit
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const where: Prisma.ProductWhereInput = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: {
          seller: true,
          images: true,
          category: true,
          subcategory: true,
        },
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Normalize images to return URLs
    const normalized = products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: Number(p.price), // Ensure it's a number
      condition: p.condition,
      stock: p.stock,
      isFeatured: p.isFeatured,
      isUsed: p.isUsed,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      // Convert images to string URLs
      images: (p.images as UploadedFile[]).map((f) => `/api/files/${f.id}`),
      // Include related data if needed
      category: p.category,
      subcategory: p.subcategory,
      seller: p.seller ? {
        id: p.seller.id,
        name: p.seller.name,
        email: p.seller.email
      } : null
    }));

    console.log(`✅ Returning ${normalized.length} products out of ${total} total`);

    // Return in the structure your frontend expects
    return NextResponse.json({
      success: true,
      products: normalized, // This is what your frontend looks for
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch products",
      products: [] // Ensure products is always an array
    }, { status: 500 });
  }
}
/**
 * ✅ POST /api/products - FIXED VERSION
 */
export async function POST(req: Request) {
  try {
    const token = extractTokenFromReq(req);
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    
    // Debug logging to see what we're receiving
    console.log("FormData entries received:");
    const entries: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        entries.push(`Key: ${key}, File: ${value.name}, Type: ${value.type}, Size: ${value.size}`);
      } else {
        entries.push(`Key: ${key}, Value: ${value}`);
      }
    }
    console.log(entries);

    // Extract form fields
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const condition = (formData.get("condition") as "NEW" | "USED") || "NEW";
    const stock = parseInt(formData.get("stock") as string) || 1;
    let categoryId = (formData.get("categoryId") as string) || null;
    let subcategoryId = (formData.get("subcategoryId") as string) || null;
    const isFeatured = formData.get("isFeatured") === "true";
    const isUsed = formData.get("isUsed") === "true";

    // Get files safely
    const fileEntries = formData.getAll("files");
    const files: File[] = [];
    
    for (const entry of fileEntries) {
      if (entry instanceof File) {
        files.push(entry);
      } else {
        console.warn("Skipping non-File entry in files:", entry);
      }
    }

    console.log(`Processing ${files.length} valid files`);

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Category validation or fallback
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        let fallback = await prisma.category.findFirst({ where: { name: "Uncategorized" } });
        if (!fallback) fallback = await prisma.category.create({ data: { name: "Uncategorized" } });
        categoryId = fallback.id;
      }
    } else {
      let fallback = await prisma.category.findFirst({ where: { name: "Uncategorized" } });
      if (!fallback) fallback = await prisma.category.create({ data: { name: "Uncategorized" } });
      categoryId = fallback.id;
    }

    // ✅ Subcategory validation
    if (subcategoryId) {
      const subcategoryExists = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
      if (!subcategoryExists) subcategoryId = null;
    }

    // ✅ Create product first
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: isNaN(price) ? 0 : price,
        condition,
        stock,
        categoryId,
        subcategoryId: subcategoryId || undefined,
        sellerId: user.id,
        isFeatured,
        isUsed,
      },
    });

    // ✅ Handle image uploads with safe processing
    let uploadedFiles: UploadedFile[] = [];
    if (files.length > 0) {
      try {
        uploadedFiles = await processFiles(files, product.id);
        console.log(`✅ Successfully processed ${uploadedFiles.length} files`);
      } catch (uploadError) {
        console.error("Error in file upload process:", uploadError);
        // Continue even if file upload fails - product is already created
      }
    }

    // ✅ Return created product with images
    const productWithImages = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        category: true,
        subcategory: true,
        seller: true,
      },
    });

    if (!productWithImages) {
      return NextResponse.json({ error: "Product created but could not be retrieved" }, { status: 500 });
    }

    const responseData = {
      ...productWithImages,
      images: productWithImages.images.map((f: UploadedFile) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        url: `/api/files/${f.id}`,
      })),
    };

    return NextResponse.json(
      { 
        message: "Product created successfully", 
        product: responseData 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}