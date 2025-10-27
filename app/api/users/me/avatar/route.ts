import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";
import { prisma } from "@/lib/prisma";

export const POST = withAuth(async (req: AuthRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `avatar_${req.user!.id}_${timestamp}.${file.name.split('.').pop()}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update user in database
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
});