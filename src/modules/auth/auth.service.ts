import { prisma } from "../../database/db";
import createHttpError from "http-errors";
import type {
  LoginInput,
  VerifyOtpInput,
  ConfirmPasswordInput,
  VerifyResetPassword,
  ResetPassword,
} from "./auth.schema";
import {
  generateAccessToken,
  verifyRefreshToken,
  generateRefreshToken,
  generateOtpToken,
  generateOtpCode,
} from "../../utils/token";
import { compareHash, hasher } from "../../utils/hash";
import { ERRORS } from "../../config/constants";
import moment from "moment";
import type { TokenPayload } from "../../utils/token";
import type { User } from "../../generated/prisma/client";

// helper functions
export const findUserByEmail = async (
  email: string,
): Promise<Omit<User, "password"> | null> => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
    omit: {
      password: true, // removes password
    },
  });
};

export const findUserByEmailWithPassword = async (
  email: string,
): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const findOtpWithEmail = async (email: string) => {
  return await prisma.otp.findUnique({
    where: {
      email,
    },
  });
};

/*****************
 * LOGIN SERVICE *
 *****************/
export const loginService = async (
  inputs: LoginInput,
): Promise<Omit<User, "password">> => {
  const { email, password } = inputs;

  // 1. find user with unique email

  const user = await findUserByEmailWithPassword(email);

  // 2. if user not found then throw error

  if (!user) {
    throw createHttpError(400, "Invalid email or password", {
      code: ERRORS.INVALID_CREDENTIALS,
    });
  }

  // 3.compare password, if it's invalid then throw error

  if (!(await compareHash(password, user.password))) {
    throw createHttpError(400, "Invalid email or password", {
      code: ERRORS.INVALID_CREDENTIALS,
    });
  }

  //4. remove password before return

  const { password: _, ...userWithOutPassword } = user;

  return userWithOutPassword;
};

/********************
 * REGISTER SERVICE *
 ********************/
export const registerService = async (email: string) => {
  const [isEmailExist, isOtpExist] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.otp.findUnique({ where: { email } }),
  ]);

  if (isEmailExist) {
    throw createHttpError(400, "Email is already taken", {
      code: ERRORS.EMAIL_ALREADY_TAKEN,
    });
  }

  const lastSentAt = isOtpExist?.lastSentAt
    ? new Date(isOtpExist.lastSentAt).toLocaleDateString()
    : null;
  const now = new Date().toLocaleDateString();
  const isSameDay = lastSentAt === now;

  if (isOtpExist && isSameDay) {
    if (isOtpExist.sentCount >= 5 || isOtpExist.invalidCount >= 5) {
      throw createHttpError(
        429,
        "Too many OTP requests. Please try again tomorrow.",
        {
          code: ERRORS.TOO_MANY_REQUESTS,
        },
      );
    }
  }

  const otpToken = generateOtpToken();
  // const otpCode = generateOtpCode();
  const otpCode = "123456"; // TODO: remove this line and uncomment above line to generate real OTP code
  const hashedOtpCode = await hasher(otpCode);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

  const otpData = await prisma.otp.upsert({
    where: { email },
    create: {
      email,
      code: hashedOtpCode,
      token: otpToken,
      lastSentAt: new Date(),
      expiresAt,
      sentCount: 1,
      invalidCount: 0,
    },
    update: {
      code: hashedOtpCode,
      token: otpToken,
      lastSentAt: new Date(),
      expiresAt,
      sentCount: isSameDay ? { increment: 1 } : 1,
      invalidCount: isSameDay ? undefined : 0,
    },
    select: {
      email: true,
      token: true,
    },
  });

  // TODO: send otpCode to user's email using email service

  return {
    token: otpData.token,
    email: otpData.email,
  };
};

/**********************
 * VERIFY OTP SERVICE *
 **********************/
export const verifyOtpService = async (inputs: VerifyOtpInput) => {
  const { email, token, code } = inputs;

  const [isUserExist, otpRecord] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.otp.findUnique({ where: { email } }),
  ]);

  if (isUserExist) {
    throw createHttpError(400, "Email is already registered", {
      code: ERRORS.EMAIL_ALREADY_TAKEN,
    });
  }

  if (!otpRecord) {
    throw createHttpError(400, "OTP not found for this email", {
      code: ERRORS.NOT_FOUND,
    });
  }

  if (otpRecord.token !== token) {
    await prisma.otp.update({
      where: { email },
      data: {
        invalidCount: 5,
      },
    });
    throw createHttpError(403, "Invalid Request,Please Try Again Tomorrow.", {
      code: ERRORS.FORBIDDEN,
    });
  }

  const lastVerifiedAt = otpRecord.lastVerifiedAt
    ? new Date(otpRecord.lastVerifiedAt).toLocaleDateString()
    : null;
  const now = new Date().toLocaleDateString();
  const isSameDay = lastVerifiedAt === now;

  if (isSameDay && otpRecord.invalidCount >= 5) {
    throw createHttpError(
      429,
      "Too many invalid OTP attempts. Please try again tomorrow.",
      {
        code: ERRORS.TOO_MANY_REQUESTS,
      },
    );
  }

  if (!(await compareHash(code, otpRecord.code))) {
    await prisma.otp.update({
      where: { email },
      data: {
        invalidCount: isSameDay ? { increment: 1 } : 1,
        lastVerifiedAt: new Date(),
      },
    });
    throw createHttpError(400, "Invalid OTP code", {
      code: ERRORS.INVALID_CREDENTIALS,
    });
  }

  if (moment(otpRecord.expiresAt).isBefore(moment())) {
    throw createHttpError(400, "OTP has expired", {
      code: ERRORS.INVALID_CREDENTIALS,
    });
  }

  const verifyToken = generateOtpToken();

  const updatedOtp = await prisma.otp.update({
    where: { email },
    data: {
      verifyToken,
      invalidCount: 0,
      lastVerifiedAt: new Date(),
    },
  });

  return {
    verifyToken: updatedOtp.verifyToken,
    email: updatedOtp.email,
  };
};

/****************************
 * CONFIRM PASSWORD SERVICE *
 ****************************/
export const confirmPasswordService = async (inputs: ConfirmPasswordInput) => {
  const { password, email, token } = inputs;

  const [isUserExist, otpRecord] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.otp.findUnique({ where: { email } }),
  ]);

  if (isUserExist) {
    throw createHttpError(400, "Email is already registered", {
      code: ERRORS.EMAIL_ALREADY_TAKEN,
    });
  }

  if (!otpRecord) {
    throw createHttpError(400, "OTP not found for this email", {
      code: ERRORS.NOT_FOUND,
    });
  }

  if (otpRecord.verifyToken !== token) {
    await prisma.otp.update({
      where: { email },
      data: {
        invalidCount: 5,
      },
    });
    throw createHttpError(400, "Invalid OTP token", {
      code: ERRORS.INVALID_CREDENTIALS,
    });
  }

  if (moment().diff(moment(otpRecord.lastVerifiedAt), "minutes") > 10) {
    throw createHttpError(
      400,
      "OTP verification has expired. Please verify OTP again.",
      {
        code: ERRORS.INVALID_CREDENTIALS,
      },
    );
  }

  const hashedPassword = await hasher(password);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  const refresh_token = generateRefreshToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  const access_token = generateAccessToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  const updatedUser = await prisma.user.update({
    where: { id: newUser.id },
    data: {
      refreshToken: refresh_token,
      lastLogin: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { user: updatedUser, access_token, refresh_token };
};

/***************************
 * FORGET PASSWORD SERVICE *
 ***************************/
export const forgetPasswordService = async (email: string) => {
  const [user, otp] = await Promise.all([
    findUserByEmail(email),
    prisma.otp.findUnique({ where: { email } }),
  ]);

  // 1. if user does not exits , throw error
  if (!user || !otp)
    throw createHttpError(404, "User Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  // 2. limit otp request 5 times per day
  const lastSentAt = otp?.lastSentAt
    ? new Date(otp.lastSentAt).toLocaleDateString()
    : null;
  const now = new Date().toLocaleDateString();
  const isSameDay = lastSentAt === now;

  if (otp && isSameDay) {
    if (otp.sentCount >= 5 || otp.invalidCount >= 5) {
      throw createHttpError(
        429,
        "Too many OTP requests. Please try again tomorrow.",
        {
          code: ERRORS.TOO_MANY_REQUESTS,
        },
      );
    }
  }

  // 3. generate otp code and token

  const otpToken = generateOtpToken();
  // const otpCode = generateOtpCode();
  const otpCode = "123456"; // TODO: remove this line and uncomment above line to generate real OTP code
  const hashedOtpCode = await hasher(otpCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); //5 min

  // 4. update otp in db
  await prisma.otp.update({
    where: {
      email,
    },
    data: {
      code: hashedOtpCode,
      token: otpToken,
      sentCount: isSameDay ? { increment: 1 } : 1,
      lastSentAt: new Date(),
      expiresAt,
    },
  });

  // 5. send otp code to user's email
  // TODO : send otp mail

  return { otpToken };
};

/*********************************
 * VERIFY RESET PASSWORD SERVICE *
 *********************************/
export const verifyResetPasswordService = async ({
  token,
  email,
  code,
}: VerifyResetPassword) => {
  const [user, otp] = await Promise.all([
    findUserByEmail(email),
    findOtpWithEmail(email),
  ]);

  //1. Throw an error if either the user or the OTP does not exist.
  if (!user || !otp)
    throw createHttpError(404, "User Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  // 2. Validate token against DB
  if (token !== otp.token) {
    await prisma.otp.update({
      where: { email },
      data: { invalidCount: 5 },
    });
    throw createHttpError(403, "Invalid Request.Please Try Again Tomorrow.", {
      code: ERRORS.FORBIDDEN,
    });
  }

  // 3. Limit invalid OTP verification attempts to 5 times per day.
  const lastVerifiedAt = otp.lastVerifiedAt
    ? new Date(otp.lastVerifiedAt).toLocaleDateString()
    : null;
  const now = new Date().toLocaleDateString();
  const isSameDay = lastVerifiedAt === now;

  if (isSameDay && otp.invalidCount >= 5)
    throw createHttpError(429, "Too Many Request.Please Try Again Tomorrow.", {
      code: ERRORS.TOO_MANY_REQUESTS,
    });

  // 4. Compare plain Otp code with hashed otp code
  if (!(await compareHash(code, otp.code))) {
    await prisma.otp.update({
      where: { email },
      data: { invalidCount: isSameDay ? { increment: 1 } : 1 },
    });
    throw createHttpError(400, "Invalid OTP", {
      code: ERRORS.INVALID_CREDENTIALS,
    });
  }

  // 5. Reject expired otp code
  if (moment(otp.expiresAt).isBefore(moment()))
    throw createHttpError(400, "OTP code is expired", {
      code: ERRORS.EXPIRED,
    });

  const verifyToken = generateOtpToken();

  const updatedOtp = await prisma.otp.update({
    where: { email },
    data: {
      verifyToken,
      lastVerifiedAt: new Date(),
    },
  });

  return { email, verifyToken };
};

/**************************
 * RESET PASSWORD SERVICE *
 **************************/
export const resetPasswordService = async ({
  token,
  email,
  password,
}: ResetPassword) => {
  const [user, otp] = await Promise.all([
    findUserByEmailWithPassword(email),
    findOtpWithEmail(email),
  ]);

  // 1. Either the user or otp does not exist, throw error
  if (!user || !otp)
    throw createHttpError(404, "User Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  // 2. Throw an error if invalid otp attempts already 5 or more
  if (otp.invalidCount >= 5)
    throw createHttpError(403, "Invalid Request", {
      code: ERRORS.FORBIDDEN,
    });

  // 3. validate verify token against DB
  if (otp.verifyToken !== token) {
    await prisma.otp.update({ where: { email }, data: { invalidCount: 5 } });
    throw createHttpError(403, "Invalid Request", {
      code: ERRORS.FORBIDDEN,
    });
  }

  /**
   * 4. REJECT THE RESET PASSWORD REQUEST IF IT IS CALLED
   *  MORE THAN ** 5 ** MINUTES AFTER SUCCESSFUL OTP VERIFICATION.
   *
   *    EXAMPLE:
   *  - CALL OTP VERIFY API -> WAIT 3 MIN -> CALL RESET PASSWORD API -> ALLOW
   *  - CALL OTP VERIFY API -> WAIT 6 MIN -> CALL RESET PASSWORD API -> REJECT
   */

  if (moment().diff(otp.updatedAt, "minutes") > 5)
    throw createHttpError(400, "Request is expired", { code: ERRORS.EXPIRED });

  /**
   * 5.  1.hash the new password
   *     2.generate new (access token and refresh token)
   *     3.update hashed password and new refresh token in DB
   */
  const hashedPassword = await hasher(password);
  const access_token = generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const refresh_token = generateRefreshToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      refreshToken: refresh_token,
    },
  });

  // remove password
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, access_token, refresh_token };
};

/**********************
 * //  LOGOUT SERVICE *
 **********************/
export const logoutService = async (refresh_token: string) => {
  if (!refresh_token)
    throw createHttpError(400, "Unauthenticated", {
      code: ERRORS.UNAUTHENTICATED,
    });

  let decoded;

  try {
    decoded = verifyRefreshToken(refresh_token);
  } catch (error) {
    throw createHttpError(401, "Unauthorized", {
      code: ERRORS.UNAUTHENTICATED,
    });
  }

  // check user is exist or not
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user)
    throw createHttpError(404, "User not found", {
      code: ERRORS.NOT_FOUND,
    });

  if (user.refreshToken !== refresh_token)
    throw createHttpError(401, "Unauthorized", {
      code: ERRORS.UNAUTHORIZED,
    });

  // invalidate refresh token
  const updatedUser = await prisma.user.update({
    where: {
      id: decoded.userId,
    },
    data: {
      refreshToken: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      refreshToken: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/*************************
 * REFRESH TOKEN SERVICE *
 *************************/
export const refreshTokenService = async ({
  refresh_token,
  decoded,
}: {
  refresh_token: string;
  decoded: TokenPayload;
}) => {
  // check user is exist or not
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user)
    throw createHttpError(404, "User not found", {
      code: ERRORS.NOT_FOUND,
    });

  if (user.refreshToken !== refresh_token) {
    await prisma.user.update({
      where: {
        id: decoded.userId,
      },
      data: {
        refreshToken: null,
      },
    });
    throw createHttpError(401, "Unauthorized", {
      code: ERRORS.UNAUTHORIZED,
    });
  }

  return user;
};

export const updateRefreshToken = async (id: string, refresh_token: string) => {
  return await prisma.user.update({
    where: { id },
    data: {
      refreshToken: refresh_token,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
