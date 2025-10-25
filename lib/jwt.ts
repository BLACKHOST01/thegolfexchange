import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined in .env");

export interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const signToken = (payload: object, expiresIn: string | number = "1h") => {
  const options: any = { expiresIn };
  return jwt.sign(payload as JwtPayload, JWT_SECRET, options);
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
};