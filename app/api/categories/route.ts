// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResponse, createErrorResponse } from "@/lib/utils";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                products: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return createResponse(categories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return createErrorResponse(error);
  }
}

// Optional: POST method for creating categories (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description
      },
      include: {
        subcategories: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return createResponse(category, 201);
  } catch (error: any) {
    console.error("Error creating category:", error);
    return createErrorResponse(error);
  }
}