import type { Request, Response, NextFunction } from "express";
import { getUserByIdService, uploadAvatarService } from "./user.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const user = await getUserByIdService();
  res.status(200).json({ success: true, data: { user } });
};

export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const file = req.file;
  const userId = req.user?.id as string;
  const updatedUser = await uploadAvatarService(file, userId);
  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: { user: updatedUser },
  });
};
