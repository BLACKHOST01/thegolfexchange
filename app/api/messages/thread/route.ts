// /app/api/messages/thread/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const other = new URL(req.url).searchParams.get("otherId");
    if (!userId || !other) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: other },
          { senderId: other, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}
