// app/api/categories/[categoryId]/subcategories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> } // params is now a Promise
) {
  try {
    // FIXED: Await the params before destructuring
    const { categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const subcategories = await prisma.subcategory.findMany({
      where: { 
        categoryId 
      },
      select: {
        id: true,
        name: true,
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

    return createResponse({ subcategories });
  } catch (error: any) {
    console.error("Error fetching subcategories:", error);
    return createErrorResponse(error);
  }
}