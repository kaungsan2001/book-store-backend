import type { Request, Response, NextFunction } from "express";
import {
  logoutService,
  registerService,
  verifyOtpService,
  confirmPasswordService,
  refreshTokenService,
  updateRefreshToken,
  loginService,
  forgetPasswordService,
  verifyResetPasswordService,
  resetPasswordService,
} from "./auth.service";
import { attachHttpCookie, clearHttpCookie } from "../../utils/cookies";
import { sendResponse } from "../../utils/response";
import { ERRORS } from "../../config/constants";
import createHttpError from "http-errors";
import {
  generateOtpToken,
  verifyRefreshToken,
  type TokenPayload,
} from "../../utils/token";
import { generateAccessToken, generateRefreshToken } from "../../utils/token";

/********************
 * LOGIN CONTROLLER *
 ********************/
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  const user = await loginService({ email, password });

  const access_token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refresh_token = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const updatedUser = await updateRefreshToken(user.id, refresh_token);

  attachHttpCookie(res, "access_token", access_token, {
    maxAge: 15 * 60 * 1000,
  }); // 15 minutes
  attachHttpCookie(res, "refresh_token", refresh_token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }); // 30 days

  return sendResponse({
    res,
    data: { user: updatedUser },
    message: "Account Logged In",
  });
};

/***********************
 * REGISTER CONTROLLER *
 ***********************/
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;

  const { token } = await registerService(email);

  return sendResponse({
    res,
    data: { token },
    message:
      "Registration successful. Please check your email for OTP verification.",
  });
};

/*************************
 * VERIFY OTP CONTROLLER *
 *************************/
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, token, code } = req.body;
  const { verifyToken } = await verifyOtpService({ email, token, code });

  return sendResponse({
    res,
    data: { verifyToken, email },
    message: "OTP verified successfully",
  });
};

/*******************************
 * CONFIRM PASSWORD CONTROLLER *
 *******************************/
export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, token, password } = req.body;
  const { user, access_token, refresh_token } = await confirmPasswordService({
    email,
    token,
    password,
  });

  attachHttpCookie(res, "access_token", access_token, {
    maxAge: 15 * 60 * 1000,
  }); // 15 minutes
  attachHttpCookie(res, "refresh_token", refresh_token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }); // 30 days

  return sendResponse({
    res,
    data: { user },
    message: "Account Registered successfully",
    statusCode: 201,
  });
};

/****************************
 * REFRESH TOKEN CONTROLLER *
 ****************************/
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refresh_token = req.cookies?.refresh_token ?? null;

  // 1. if refresh_token does not exist , throw error
  if (!refresh_token) {
    clearHttpCookie(res, "access_token");
    clearHttpCookie(res, "refresh_token");
    throw createHttpError(401, "Unauthorized", {
      code: ERRORS.UNAUTHENTICATED,
    });
  }

  // 2. if refresh token is invalid , clear auth cookies and throw error
  let decoded: TokenPayload;
  try {
    decoded = verifyRefreshToken(refresh_token);
  } catch (error: any) {
    clearHttpCookie(res, "access_token");
    clearHttpCookie(res, "refresh_token");

    if (error.name === "TokenExpiredError") {
      throw createHttpError(401, "Unauthorized", {
        code: ERRORS.REFRESH_TOKEN_EXPIRED,
      });
    }

    if (error.name === "JsonWebTokenError") {
      throw createHttpError(401, "Unauthorized", {
        code: ERRORS.UNAUTHENTICATED,
      });
    }

    throw createHttpError(500, "Internal Server Error", {
      code: ERRORS.INTERNAL_SERVER_ERROR,
    });
  }

  //3. validate refresh token against DB
  const user = await refreshTokenService({ refresh_token, decoded });

  // 4. after all passed -> generate new auth tokens
  const newAccessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  //4. update refresh token in DB
  const updatedUser = await updateRefreshToken(user.id, newRefreshToken);

  //5. attach auth tokens in cookies
  attachHttpCookie(res, "access_token", newAccessToken, {
    maxAge: 15 * 60 * 1000,
  }); // 15 minutes
  attachHttpCookie(res, "refresh_token", newRefreshToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }); // 30 days

  //6. response
  return sendResponse({
    res,
    data: { user: updatedUser },
    message: "Token refreshed successfully",
  });
};

/******************************
 * FORGET PASSWORD CONTROLLER *
 ******************************/
export const forgetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const { otpToken } = await forgetPasswordService(email);

  sendResponse({
    res,
    data: { token: otpToken },
    message: "We have sent OTP code to your email.",
  });
};

/************************************
 * VERIFY RESET PASSWORD CONTROLLER *
 ************************************/
export const verifyResetPassword = async (req: Request, res: Response) => {
  const { token, email, code } = req.body;
  const { verifyToken } = await verifyResetPasswordService({
    email,
    token,
    code,
  });

  sendResponse({
    res,
    data: { token: verifyToken },
    message: "Your Otp is verified",
  });
};

/*****************************
 * RESET PASSWORD CONTROLLER *
 *****************************/
export const resetPassword = async (req: Request, res: Response) => {
  const { token, email, password } = req.body;
  const { user, access_token, refresh_token } = await resetPasswordService({
    token,
    email,
    password,
  });

  attachHttpCookie(res, "access_token", access_token, {
    maxAge: 15 * 60 * 1000,
  }); // 15 minutes
  attachHttpCookie(res, "refresh_token", refresh_token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }); // 30 days

  sendResponse({ res, data: { user }, message: "Password reset successfully" });
};

/*********************
 * LOGOUT CONTROLLER *
 *********************/
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refresh_token = req.cookies ? req.cookies.refresh_token : null;

  const user = await logoutService(refresh_token);

  clearHttpCookie(res, "access_token");
  clearHttpCookie(res, "refresh_token");

  return sendResponse({ res, data: { user }, message: "Logged Out" });
};
