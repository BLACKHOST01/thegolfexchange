import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined in .env");

// Password helpers
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

// JWT helpers
export const signToken = (payload: object, expiresIn: string | number = "1m") => {
  // Cast options as any to bypass TS typing issue in v9+
  const options: any = { expiresIn };
  return jwt.sign(payload as JwtPayload, JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};
