// app/api/track/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.eventType) {
      return NextResponse.json(
        { ok: false, error: "eventType required" },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : undefined;

    const event = await prisma.event.create({
      data: {
        visitorId: body.visitorId ?? null,
        userId: body.userId ?? null,
        sessionId: body.sessionId ?? null,
        eventType: body.eventType,
        eventProperties: body.eventProperties ?? {},
        url: body.url ?? null,
        referrer: body.referrer ?? null,
        userAgent: body.userAgent ?? null,
        ipAddr: ip ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
  } catch (err) {
    console.error("Event ingest error", err);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
