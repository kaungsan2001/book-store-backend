import { prisma } from "../../database/db";
import createHttpError from "http-errors";
import { unlink } from "fs/promises";
import path from "path";
import { ERRORS } from "../../config/constants";

export const getUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      refreshToken: true,
      avatarUrl: true,
    },
  });
};

export const updateUserById = async (userId: string, data: any) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
  });
};

//  helper function
async function imageUnlink(filePath: string) {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

export const getUserByIdService = async () => {
  const user = await prisma.user.findUnique({
    where: { id: "cmpfgzusj00002t8qvtl4un7h" },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    throw createHttpError(404, "User not found", {
      code: "ERROR_USER_NOT_FOUND",
    });
  }

  return user;
};

//------------------------- start - upload avatar service --------------------------------//
export const uploadAvatarService = async (
  file?: Express.Multer.File,
  userId?: string,
) => {
  if (!file) {
    throw createHttpError(400, "No file uploaded", {
      code: "ERROR_FILE_REQUIRED",
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, avatarUrl: true },
  });

  if (!user) {
    throw createHttpError(404, "User not found", {
      code: "ERROR_USER_NOT_FOUND",
    });
  }

  /**
   * if user has an existing avatar,
   * delete the old avatar image
   */

  if (user.avatarUrl) {
    const oldAvatarPath = path.join(
      __dirname,
      "../../uploads/avatars",
      user.avatarUrl,
    );
    imageUnlink(oldAvatarPath);
  }

  /**
   * if db update fails,
   * delete the newly uploaded image
   * then throw error
   */
  let updatedUser;
  try {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: file.filename },
    });
  } catch (error) {
    const newAvatarPath = path.join(
      __dirname,
      "../../uploads/avatars",
      file.filename,
    );

    await imageUnlink(newAvatarPath);

    throw createHttpError(500, "Failed to update user avatar", {
      code: ERRORS.INTERNAL_SERVER_ERROR,
    });
  }

  return updatedUser;
};
