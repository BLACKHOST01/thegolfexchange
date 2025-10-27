import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const requiredFields = [
      { field: 'title', message: 'Product title is required' },
      { field: 'description', message: 'Product description is required' },
      { field: 'price', message: 'Valid price is required' },
      { field: 'sellerId', message: 'Seller ID is required' },
      { field: 'categoryId', message: 'Category is required' },
      { field: 'condition', message: 'Product condition is required' }
    ];

    for (const { field, message } of requiredFields) {
      if (!productData[field]) {
        console.log(`❌ Missing ${field}`);
        return NextResponse.json(
          { error: message },
          { status: 400 }
        );
      }
    }

    // Validate price
    if (productData.price <= 0) {
      console.log("❌ Invalid price:", productData.price);
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate stock
    const stock = parseInt(productData.stock) || 0;
    if (stock < 0) {
      console.log("❌ Invalid stock:", stock);
      return NextResponse.json(
        { error: "Stock cannot be negative" },
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

    // Check if category exists
    console.log("🟡 Checking category:", productData.categoryId);
    const category = await prisma.category.findUnique({
      where: { id: productData.categoryId }
    });

    if (!category) {
      console.log("❌ Category not found:", productData.categoryId);
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Check if subcategory exists if provided
    if (productData.subcategoryId) {
      console.log("🟡 Checking subcategory:", productData.subcategoryId);
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: productData.subcategoryId }
      });

      if (!subcategory) {
        console.log("❌ Subcategory not found:", productData.subcategoryId);
        return NextResponse.json(
          { error: "Invalid subcategory" },
          { status: 400 }
        );
      }
    }

    console.log("🟡 Creating product in database...");
    
    // Handle image uploads
    const files = formData.getAll("files") as File[];
    let imageData: any[] = [];
    
    if (files.length > 0) {
      console.log(`🟡 Processing ${files.length} files`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🟡 Processing file ${i + 1}:`, file.name, file.type, file.size);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.log("❌ Invalid file type:", file.type);
          return NextResponse.json(
            { error: `File ${file.name} is not an image` },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.log("❌ File too large:", file.size);
          return NextResponse.json(
            { error: `File ${file.name} is too large. Maximum size is 5MB` },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        imageData.push({
          name: file.name,
          mimeType: file.type,
          data: buffer,
        });
      }
    } else {
      console.log("🟡 No files uploaded");
    }

    // Create the product with images in a transaction
    console.log("🟡 Starting database transaction...");
    
    const product = await prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          title: productData.title.trim(),
          description: productData.description.trim(),
          price: parseFloat(productData.price),
          stock: stock,
          condition: productData.condition,
          categoryId: productData.categoryId,
          subcategoryId: productData.subcategoryId || null,
          location: productData.location?.trim() || null,
          isFeatured: Boolean(productData.isFeatured),
          isUsed: productData.condition === "USED",
          sellerId: productData.sellerId,
        }
      });

      // Create images if any
      if (imageData.length > 0) {
        await tx.uploadedFile.createMany({
          data: imageData.map(img => ({
            ...img,
            productId: newProduct.id
          }))
        });
      }

      // Fetch the complete product with relations
      const completeProduct = await tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          subcategory: {
            select: {
              id: true,
              name: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          images: {
            select: {
              id: true,
              name: true,
              mimeType: true,
            },
          },
        },
      });

      return completeProduct;
    });

    console.log("✅ Product created successfully:", product?.id);
    console.log("✅ Product details:", product);

    return NextResponse.json(product, { status: 201 });
    
  } catch (error: any) {
    console.error("❌ Error creating product:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this title already exists" },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      const field = error.meta?.field_name || 'unknown field';
      return NextResponse.json(
        { error: `Invalid reference: ${field}` },
        { status: 400 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Referenced record not found" },
        { status: 400 }
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid product data format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create product",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}



export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            name: true,
            mimeType: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        // ✅ Include reviews with user information
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        // Ensure numeric fields are properly converted
        ...(body.price && { price: parseFloat(body.price) }),
        ...(body.stock && { stock: parseInt(body.stock) }),
      },
      include: {
        images: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          take: 1,
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if product has existing orders
    if (existingProduct.orderItems.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete product with existing orders",
          details: "This product has been ordered by customers and cannot be deleted for historical records."
        },
        { status: 400 }
      );
    }

    // Use transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // Delete related cart items
      await tx.cartItem.deleteMany({
        where: { productId: id }
      });

      // Delete related reviews
      await tx.review.deleteMany({
        where: { productId: id }
      });

      // Delete product images
      await tx.uploadedFile.deleteMany({
        where: { productId: id }
      });

      // Finally delete the product
      await tx.product.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      message: "Product deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete product due to existing references" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}