import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo (replace with real database in production)
const avatarStorage = new Map();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // ✅ FIX: params is now a Promise
) {
  try {
    const { userId } = await params; // ✅ FIX: Await the params
    
    console.log('🔍 Avatar upload request received for user:', userId);
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));

    if (!userId) {
      console.log('❌ No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // Log all formData entries
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
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only image files are allowed' },
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

    // Convert file to base64 for simple storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Store in memory (replace with database in production)
    avatarStorage.set(userId, {
      data: base64Image,
      type: file.type,
      name: file.name,
      uploadedAt: new Date().toISOString()
    });

    console.log('✅ Avatar stored successfully for user:', userId);

    return NextResponse.json({ 
      success: true,
      avatarUrl: base64Image, // Return base64 data directly for immediate use
      message: 'Avatar uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to serve the avatar image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // ✅ FIX: params is now a Promise
) {
  try {
    const { userId } = await params; // ✅ FIX: Await the params
    
    console.log('🔍 GET avatar request for user:', userId);
    
    const avatarData = avatarStorage.get(userId);
    if (!avatarData) {
      console.log('❌ Avatar not found for user:', userId);
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      );
    }

    console.log('✅ Avatar found, returning image data');

    // Convert base64 back to buffer for image response
    const base64Data = avatarData.data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': avatarData.type,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('❌ Error retrieving avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}