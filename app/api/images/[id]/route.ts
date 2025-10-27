import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Use shared Prisma instance

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new NextResponse("Image ID is required", { status: 400 });
    }

    // Validate ID format (basic check)
    if (id.length < 1) {
      return new NextResponse("Invalid image ID", { status: 400 });
    }

    const image = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!image) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Convert the Buffer to a Uint8Array
    const uint8Array = new Uint8Array(image.data);

    // Set appropriate headers
    const headers = new Headers();
    headers.set("Content-Type", image.mimeType);
    headers.set("Content-Length", uint8Array.length.toString());
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // 1 year cache
    headers.set("Content-Disposition", `inline; filename="${image.name}"`);

    // Add CORS headers if needed
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving image:", error);
    
    // Return a generic error without exposing internal details
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optional: Add HEAD method for checking image existence without downloading
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new NextResponse("Image ID is required", { status: 400 });
    }

    const image = await prisma.uploadedFile.findUnique({
      where: { id },
      select: { 
        id: true,
        mimeType: true,
        name: true 
      },
    });

    if (!image) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", image.mimeType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Disposition", `inline; filename="${image.name}"`);

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in HEAD request for image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}