import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wishlist: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wishlistItems = user.wishlist.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.title,
      price: item.product.price,
      image: item.product.images[0]?.name || "/images/placeholder.jpg",
      addedAt: item.addedAt,
      inStock: item.product.stock > 0,
    }));

    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "Product already in wishlist" },
        { status: 400 }
      );
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
        addedAt: new Date(),
      },
      include: {
        product: {
          select: {
            title: true,
            price: true,
            images: true,
            stock: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: wishlistItem.id,
      productId: wishlistItem.productId,
      productName: wishlistItem.product.title,
      price: wishlistItem.product.price,
      image: wishlistItem.product.images[0]?.name || "/images/placeholder.jpg",
      addedAt: wishlistItem.addedAt,
      inStock: wishlistItem.product.stock > 0,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
