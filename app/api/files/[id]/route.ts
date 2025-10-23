import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ params is a Promise
) {
  const { params } = context;
  const { id } = await params; // ✅ await the Promise

  try {
    const file = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = Buffer.from(file.data);

    return new Response(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.name}"`,
      },
    });
  } catch (err) {
    console.error("Error fetching file:", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
