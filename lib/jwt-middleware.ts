import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const withAuth = (handler: Function) => {
  return async (req: AuthRequest) => {
    try {
      const authHeader = req.headers.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - No token provided" }),
          { status: 401 }
        );
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid token" }),
          { status: 401 }
        );
      }

      // Add user to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      return handler(req);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500 }
      );
    }
  };
};