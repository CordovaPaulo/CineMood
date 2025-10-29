import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export function generateToken(payload: object | string, expiresIn: number = (60 * 60 * 24)): string {
  const options: jwt.SignOptions = { expiresIn };
  return jwt.sign(payload as jwt.JwtPayload | string, SECRET_KEY as string, options);
}

export function verifyToken(token: string): object | string | null {
  try {
    return jwt.verify(token, SECRET_KEY as string);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export function decodeToken(token: string): object | string | null {
    try {
        return jwt.decode(token) || null;
    } catch (error) {
        console.error("Token decoding failed:", error);
        return null;
    }
}