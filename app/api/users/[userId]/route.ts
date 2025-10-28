import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface UserUpdateData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
}

// Helper function to validate email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to handle errors
const handleError = (error: unknown, message: string) => {
  console.error(`${message}:`, error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Mock response - replace with actual database call
    const mockUser = {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      role: "USER",
      avatar: "/avatar-placeholder.png",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    if (!mockUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(mockUser);
  } catch (error) {
    return handleError(error, 'Error fetching user');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const updateData: UserUpdateData = await request.json();

    // Validate required fields
    if (!updateData.name?.trim() || !updateData.email?.trim() || !updateData.role?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(updateData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Mock response - replace with actual database update
    const updatedUser = {
      id: userId,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    return handleError(error, 'Error updating user');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Delete logic here - in real implementation, you would:
    // 1. Delete user from database
    // 2. Clean up associated files (like avatars)
    // 3. Handle any related data cleanup

    return NextResponse.json({ 
      success: true, 
      message: `User ${userId} deleted successfully` 
    });
  } catch (error) {
    return handleError(error, 'Error deleting user');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `avatar-${userId}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${filename}`;

    // ✅ In real implementation, update user in database with avatar URL
    // Example with Prisma:
    /*
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    });
    */

    return NextResponse.json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar uploaded successfully' 
    });

  } catch (error) {
    return handleError(error, 'Avatar upload error');
  }
}