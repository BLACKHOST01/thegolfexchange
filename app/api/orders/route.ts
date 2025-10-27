import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

// ✅ GET /api/orders
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    // Build the where clause using Prisma types
    const where: Prisma.OrderWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { buyer: { name: { contains: search, mode: "insensitive" } } },
                { buyer: { email: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
        status &&
        ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].includes(
          status
        )
          ? {
              status: status as
                | "PENDING"
                | "PAID"
                | "SHIPPED"
                | "DELIVERED"
                | "CANCELLED",
            }
          : {},
      ].filter(
        (condition) => Object.keys(condition).length > 0
      ) as Prisma.OrderWhereInput[],
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: {
                  select: {
                    id: true,
                    name: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            provider: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}


// ✅ POST /api/orders
export const POST = withAuth(async (req: AuthRequest) => {
  try {
    const { items, totalAmount, shippingAddress } = await req.json();

    // Create order
    const order = await prisma.order.create({
      data: {
        totalAmount,
        buyerId: req.user!.id,
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
          })),
        },
        shippingAddress: {
          create: shippingAddress,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
});
