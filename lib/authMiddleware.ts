// lib/authMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * Protects API routes using the HttpOnly cookie named `token`
 * Returns decoded user data or a NextResponse (401) if unauthorized
 */
export const requireAuth = (req: NextRequest) => {
  try {
    // 1️⃣ Read JWT from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    // 2️⃣ Verify token (throws if expired or invalid)
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3️⃣ Return decoded payload (e.g., { id, role })
    return decoded;
  } catch (error: any) {
    // 4️⃣ Handle expiration or invalid token
    if (error.name === "TokenExpiredError") {
      const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
      res.cookies.delete("token");
      return res;
    }

    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
};
