import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

// GET /api/users/me/orders - Get user orders
export const GET = withAuth(async (req: AuthRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const page = parseInt(searchParams.get("page") || "1");

    const orders = await prisma.order.findMany({
      where: {
        buyerId: req.user!.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
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
        shippingAddress: true,
        transaction: {
          select: {
            id: true,
            status: true,
            provider: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Transform orders for frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items,
      shippingAddress: order.shippingAddress,
      transaction: order.transaction,
    }));

    return NextResponse.json(transformedOrders);
  } catch (error: any) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
});