import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/jwt-middleware";

// POST /api/users/me/avatar - Upload avatar
export const POST = withAuth(async (req: AuthRequest) => {
  try {
    const formData = await req.formData();
    const avatarFile = formData.get("avatar") as File;

    if (!avatarFile) {
      return NextResponse.json(
        { error: "Avatar file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!avatarFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (avatarFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be less than 2MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For now, we'll store a placeholder URL
    // In a real app, you'd upload to cloud storage or store in database
    const avatarUrl = `/api/images/avatar-${Date.now()}`;

    // Update user with avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      message: "Avatar uploaded successfully",
      avatarUrl: updatedUser.avatar,
    });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
});