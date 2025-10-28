import { NextRequest, NextResponse } from 'next/server';

interface UserUpdateData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // ✅ Use Promise
) {
  try {
    const { userId } = await params; // ✅ Await params
    
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
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // ✅ Use Promise
) {
  try {
    const { userId } = await params; // ✅ Await params
    const updateData: UserUpdateData = await request.json();

    // Validate required fields
    if (!updateData.name || !updateData.email || !updateData.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Mock response - replace with actual database update
    const updatedUser = {
      id: userId,
      ...updateData,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // ✅ Use Promise
) {
  try {
    const { userId } = await params; // ✅ Await params

    // Delete logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}