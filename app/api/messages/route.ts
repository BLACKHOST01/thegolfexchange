// /app/api/messages/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const senderId = req.headers.get("x-user-id");
    if (!senderId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const { receiverId, content } = await req.json();
    if (!receiverId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const msg = await prisma.message.create({
      data: { senderId, receiverId, content },
    });
    return NextResponse.json(msg);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
