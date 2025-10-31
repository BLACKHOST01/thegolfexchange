import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus, NoteType } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

// Schemas and utilities
import {
  CreateOrderSchema,
  GetOrdersQuerySchema,
  type CreateOrderInput,
} from "@/lib/schemas/order";
import {
  generateOrderNumber,
  createResponse,
  createErrorResponse,
} from "@/lib/utils";
import { OrderError, ValidationError, NotFoundError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

// Configuration
const ORDER_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
  },
};

// ✅ GET /api/orders
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters with proper defaults
    const queryParams = GetOrdersQuerySchema.parse({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "ALL",
      page: searchParams.get("page") ? Math.max(Number(searchParams.get("page")), 1) : 1,
      limit: searchParams.get("limit") ? Math.min(
        Number(searchParams.get("limit")),
        ORDER_CONFIG.maxPageSize
      ) : ORDER_CONFIG.defaultPageSize,
    });

    const { search, status, page, limit } = queryParams;
    const skip = (page - 1) * limit;

    // Build the where clause using Prisma types
    const where: Prisma.OrderWhereInput = {};

    // Add search conditions
    if (search) {
      where.OR = [
        { buyer: { name: { contains: search, mode: "insensitive" } } },
        { buyer: { email: { contains: search, mode: "insensitive" } } },
        {
          items: {
            some: {
              product: { title: { contains: search, mode: "insensitive" } },
            },
          },
        },
        { orderNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add status filter
    if (status && status !== "ALL") {
      if (Object.values(OrderStatus).includes(status as OrderStatus)) {
        where.status = status as OrderStatus;
      }
    }

    // Execute queries in parallel
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
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
          transaction: {
            select: {
              id: true,
              provider: true,
              status: true,
            },
          },
          shippingAddress: true,
          notes: {
            select: {
              id: true,
              content: true,
              type: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const responseData = {
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    };

    return createResponse(responseData);
  } catch (error: any) {
    return createErrorResponse(error);
  }
}

// ✅ POST /api/orders
export const POST = withAuth(
  rateLimit(async (req: AuthRequest) => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = CreateOrderSchema.safeParse(body);

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new ValidationError(
          `${firstError.path.join(".")}: ${firstError.message}`
        );
      }

      const { items, totalAmount, shippingAddress, notes } =
        validationResult.data;

      // Check product availability and validate items in a single query
      const productIds = items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          stock: true,
          title: true,
          price: true,
        },
      });

      // Validate all products exist and have sufficient stock
      const stockErrors: string[] = [];
      const priceMismatches: string[] = [];

      items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);

        if (!product) {
          stockErrors.push(`Product not found: ${item.productId}`);
          return;
        }

        if (product.stock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        // Optional: Validate price matches product current price
        if (Math.abs(product.price - item.price) > 0.01) {
          priceMismatches.push(
            `Price mismatch for "${product.title}". Expected: ${product.price}, Received: ${item.price}`
          );
        }
      });

      if (stockErrors.length > 0) {
        throw new OrderError(stockErrors.join("; "), "INSUFFICIENT_STOCK");
      }

      // Create order within a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            totalAmount,
            buyerId: req.user!.id,
            items: {
              create: items.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
              })),
            },
            shippingAddress: {
              create: {
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
              },
            },
          },
        });

        // Create note separately if provided
        if (notes) {
          await tx.note.create({
            data: {
              content: notes,
              type: NoteType.CUSTOMER, // Use CUSTOMER for order notes from customers
              orderId: order.id,
              authorId: req.user!.id,
            },
          });
        }

        // Update product stock for each item
        const stockUpdates = items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        );

        await Promise.all(stockUpdates);

        // Fetch the complete order with all relations
        const completeOrder = await tx.order.findUnique({
          where: { id: order.id },
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
                    price: true,
                  },
                },
              },
            },
            shippingAddress: true,
            notes: {
              select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        return completeOrder!;
      });

      return createResponse(result, 201);
    } catch (error: any) {
      return createErrorResponse(error);
    }
  }, ORDER_CONFIG.rateLimit)
);