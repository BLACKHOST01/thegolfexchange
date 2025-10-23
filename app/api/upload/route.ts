import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const files = data.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Save files to DB
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const record = await prisma.uploadedFile.create({
          data: {
            name: file.name,
            mimeType: file.type,
            data: buffer,
          },
        });
        return {
          id: record.id,
          name: record.name,
          mimeType: record.mimeType,
          url: `/api/files/${record.id}`, // direct access URL
        };
      })
    );

    return NextResponse.json({ files: uploadedFiles }, { status: 201 });
  } catch (err: any) {
    console.error("Error uploading files:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload files" },
      { status: 500 }
    );
  }
}
