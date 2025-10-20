// lib/authMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export const requireAuth = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  return decoded; // contains userId and role
};
