import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const image = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!image) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Convert the Buffer to a Uint8Array
    const uint8Array = new Uint8Array(image.data);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}