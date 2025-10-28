import { NextRequest, NextResponse } from 'next/server';

const avatarStorage = new Map();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Upload request received');
    
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    console.log('🔍 Form data:', {
      hasUserId: !!userId,
      userId: userId,
      hasFile: !!file,
      fileName: file?.name
    });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Store
    avatarStorage.set(userId, {
      data: base64Image,
      type: file.type,
      uploadedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      avatarUrl: base64Image,
      message: 'Avatar uploaded successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}