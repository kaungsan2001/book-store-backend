import type { Response, CookieOptions } from "express";

type CookieName = "access_token" | "refresh_token";

export const attachHttpCookie = (
  res: Response,
  name: CookieName,
  value: string,
  options: CookieOptions = {},
) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    ...options,
  });
};

export const clearHttpCookie = (res: Response, name: CookieName) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
};
