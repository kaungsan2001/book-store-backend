import jwt from "jsonwebtoken";
import { randomBytes, randomInt } from "crypto";

export type TokenPayload = {
  userId: string;
  email: string;
  role: "ADMIN" | "AUTHOR" | "USER";
};

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
};

// ------------------- otp token and code generation ----------------------

export const generateOtpToken = (): string => {
  return randomBytes(32).toString("hex");
};

export const generateOtpCode = (): string => {
  return randomInt(100000, 999999).toString(); // Generate a 6-digit OTP code
};
