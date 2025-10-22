import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ======================
// CONFIGURATION
// ======================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined in .env");

// ======================
// PASSWORD HELPERS
// ======================

/**
 * Hashes a plain password using bcrypt.
 */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain password with a stored hash.
 */
export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

// ======================
// JWT HELPERS
// ======================

/**
 * Defines the structure of a decoded token.
 */
export interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Signs a JWT token with the given payload.
 * Default expiration: 1 minute (you can change this to "1h" or "7d" as needed)
 */
export const signToken = (payload: object, expiresIn: string | number = "1h") => {
  const options: any = { expiresIn };
  return jwt.sign(payload as JwtPayload, JWT_SECRET, options);
};

/**
 * Verifies and decodes a JWT token.
 * Returns the decoded payload if valid, or null if invalid/expired.
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
};
