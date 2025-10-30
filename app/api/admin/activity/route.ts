import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [recentOrders, recentUsers, recentProducts] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        include: {
          buyer: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    const activities = [
      ...recentOrders.map(order => ({
        id: order.id,
        type: 'order' as const,
        title: `New order from ${order.buyer?.name || 'Unknown Buyer'}`, // Fixed: Added null check
        description: `Order total: $${order.totalAmount}`,
        timestamp: order.createdAt.toISOString(),
        status: order.status
      })),
      ...recentUsers.map(user => ({
        id: user.id,
        type: 'user' as const,
        title: `New user registered: ${user.name}`,
        description: user.email,
        timestamp: user.createdAt.toISOString()
      })),
      ...recentProducts.map(product => ({
        id: product.id,
        type: 'product' as const,
        title: `New product: ${product.title}`,
        description: `Price: $${product.price}`,
        timestamp: product.createdAt.toISOString()
      }))
    ];

    // Sort by timestamp and take the 8 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return NextResponse.json(sortedActivities);
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}