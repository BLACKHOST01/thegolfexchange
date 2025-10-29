// lib/api-utils.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
  }
}

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new AppError("Authentication required", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}