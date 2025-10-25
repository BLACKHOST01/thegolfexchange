
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";


export async function POST(req: Request) {
  console.log("🟡 API Route: /api/products called");
  
  try {
    const formData = await req.formData();
    const productDataJson = formData.get("productData") as string;
    
    console.log("🟡 Received productDataJson:", productDataJson);
    
    if (!productDataJson) {
      console.log("❌ No productData found in formData");
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 }
      );
    }

    const productData = JSON.parse(productDataJson);
    console.log("🟡 Parsed productData:", productData);
    
    // Validate required fields
    if (!productData.title?.trim()) {
      console.log("❌ Missing title");
      return NextResponse.json(
        { error: "Product title is required" },
        { status: 400 }
      );
    }

    if (!productData.description?.trim()) {
      console.log("❌ Missing description");
      return NextResponse.json(
        { error: "Product description is required" },
        { status: 400 }
      );
    }

    if (!productData.price || productData.price <= 0) {
      console.log("❌ Invalid price:", productData.price);
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    if (!productData.sellerId) {
      console.log("❌ Missing sellerId");
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Check if seller exists
    console.log("🟡 Checking seller:", productData.sellerId);
    const seller = await prisma.user.findUnique({
      where: { id: productData.sellerId }
    });

    if (!seller) {
      console.log("❌ Seller not found:", productData.sellerId);
      return NextResponse.json(
        { error: "Invalid seller" },
        { status: 400 }
      );
    }

    console.log("🟡 Creating product in database...");
    
    // Handle image uploads first if any
    const files = formData.getAll("files") as File[];
    let imageData: any[] = [];
    
    if (files.length > 0) {
      console.log(`🟡 Processing ${files.length} files`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🟡 Processing file ${i + 1}:`, file.name, file.type, file.size);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        imageData.push({
          name: file.name,
          mimeType: file.type,
          data: buffer,
        });
      }
    }

    // Create the product with images
    const product = await prisma.product.create({
      data: {
        title: productData.title.trim(),
        description: productData.description.trim(),
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock) || 0,
        condition: productData.condition,
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId || null,
        location: productData.location || null,
        isFeatured: Boolean(productData.isFeatured),
        isUsed: productData.condition === "USED", // Set isUsed based on condition
        sellerId: productData.sellerId,
        // Create images in the same operation
        images: {
          create: imageData
        }
      },
      include: {
        category: true,
        subcategory: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true,
      },
    });

    console.log("✅ Product created successfully:", product.id);
    console.log("✅ Product details:", product);

    return NextResponse.json(product, { status: 201 });
    
  } catch (error: any) {
    console.error("❌ Error creating product:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this title already exists" },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid category, subcategory, or seller" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create product",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const condition = searchParams.get("condition");
    const stock = searchParams.get("stock");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any[] = [];

    // Search condition
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Condition filter
    if (condition && condition !== "ALL") {
      whereConditions.push({ condition: condition as any });
    }

    // Stock filter
    if (stock && stock !== "ALL") {
      switch (stock) {
        case "IN_STOCK":
          whereConditions.push({ stock: { gt: 10 } });
          break;
        case "LOW_STOCK":
          whereConditions.push({ stock: { lt: 10, gt: 0 } });
          break;
        case "OUT_OF_STOCK":
          whereConditions.push({ stock: 0 });
          break;
      }
    }

    // Featured filter
    if (featured && featured !== "ALL") {
      whereConditions.push({ isFeatured: featured === "FEATURED" });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              name: true,
            },
          },
          subcategory: {
            select: {
              name: true,
            },
          },
          seller: {
            select: {
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              name: true,
            },
            take: 1,
          },
        },
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}