import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Define proper User interface
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string; // Add updatedAt as optional
}

interface UserUpdateData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
}

// In-memory storage for demo - this will persist during server runtime
let users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    role: "USER",
    avatar: "/avatar-placeholder.png",
    isVerified: true,
    createdAt: new Date().toISOString(),
  }
];

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

// Helper function to find user by ID
const findUserById = (userId: string): User | undefined => {
  return users.find(u => u.id === userId);
};

// Helper function to update user
const updateUser = (userId: string, updateData: Partial<UserUpdateData>): User | null => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    updatedAt: new Date().toISOString(), // This is now allowed
  };
  
  return users[userIndex];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
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

    // Update user in memory
    const updatedUser = updateUser(userId, updateData);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    users.splice(userIndex, 1);

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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
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

    // Check if user exists
    const existingUser = findUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // ✅ Update user in memory with the new avatar URL
    const updatedUser = updateUser(userId, { avatar: avatarUrl });
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user avatar' }, { status: 500 });
    }

    console.log('Avatar uploaded successfully for user:', userId);
    console.log('Updated user data:', updatedUser);

    return NextResponse.json({ 
      success: true, 
      avatarUrl,
      user: updatedUser, // Return the complete updated user
      message: 'Avatar uploaded successfully' 
    });

  } catch (error) {
    return handleError(error, 'Avatar upload error');
  }
}