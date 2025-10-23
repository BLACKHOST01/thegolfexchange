// /app/api/subcategories/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const subcategories = await prisma.subcategory.findMany();
  return NextResponse.json(subcategories);
}
