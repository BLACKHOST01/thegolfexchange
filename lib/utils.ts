import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

export const createResponse = (data: any, status: number = 200) => {
  return NextResponse.json({
    success: status < 400,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
};

export const createErrorResponse = (error: any) => {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    }, { status: error.statusCode });
  }

  // Prisma errors
  if (error.code === 'P2002') {
    return NextResponse.json({
      success: false,
      error: {
        message: "Duplicate entry found",
        code: "DUPLICATE_ENTRY",
      },
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  // Default server error
  return NextResponse.json({
    success: false,
    error: {
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
    timestamp: new Date().toISOString(),
  }, { status: 500 });
};