import type { Response } from "express";

export const sendResponse = ({
  res,
  data,
  message,
  meta,
  statusCode = 200,
}: {
  res: Response;
  data: unknown;
  message: string;
  meta?: Record<any, any>;
  statusCode?: number;
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};
