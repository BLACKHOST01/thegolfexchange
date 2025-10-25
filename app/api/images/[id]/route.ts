import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return new NextResponse('Image ID is required', { status: 400 });
    }

    // Fetch the image from database
    const imageFile = await prisma.uploadedFile.findUnique({
      where: { id }
    });

    if (!imageFile) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Convert to Buffer
    const imageBuffer = Buffer.from(imageFile.data);

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': imageFile.mimeType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}