import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log('🔍 Avatar upload request received for user:', userId);

    if (!userId) {
      console.log('❌ No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    console.log('🔍 FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
      if (value instanceof File) {
        console.log(`    File details - name: ${value.name}, size: ${value.size}, type: ${value.type}`);
      }
    }

    const file = formData.get('avatar') as File;
    
    console.log('🔍 Retrieved file from formData:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      isFileInstance: file instanceof File
    });

    if (!file) {
      console.log('❌ No file found in formData');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    console.log('✅ File validation passed, processing...');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log('✅ Created upload directory:', uploadsDir);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.type.split('/')[1];
    const filename = `avatar-${userId}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file to filesystem
    await writeFile(filepath, buffer);
    console.log('✅ File saved to:', filepath);

    // Create URL for the avatar (relative to public directory)
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update user in database with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        avatar: avatarUrl 
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isVerified: true,
      },
    });

    console.log('✅ Avatar updated in database for user:', userId);

    return NextResponse.json({ 
      success: true,
      avatarUrl: avatarUrl,
      message: 'Avatar uploaded successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to serve the avatar image from file system
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log('🔍 GET avatar request for user:', userId);

    // Get user from database to find avatar URL
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user || !user.avatar) {
      console.log('❌ Avatar not found for user:', userId);
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      );
    }

    // Extract filename from avatar URL
    const filename = user.avatar.split('/').pop();
    const filepath = join(process.cwd(), 'public', 'uploads', 'avatars', filename!);

    if (!existsSync(filepath)) {
      console.log('❌ Avatar file not found on disk:', filepath);
      return NextResponse.json(
        { error: 'Avatar file not found' },
        { status: 404 }
      );
    }

    // Read file as Buffer
    const buffer = await readFile(filepath);
    
    // Determine content type from file extension
    const extension = filename!.split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    }[extension!] || 'image/jpeg';

    console.log('✅ Avatar found, returning image data');

    // Convert Buffer to Uint8Array which is compatible with Response
    const uint8Array = new Uint8Array(buffer);
    
    // Create headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=86400');

    // Return the response with Uint8Array
    return new Response(uint8Array, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('❌ Error retrieving avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}