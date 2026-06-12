import type { Request, Response } from "express";
import createHttpError from "http-errors";
import multer, { type FileFilterCallback } from "multer";
import { ERRORS } from "../config/constants";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file: Express.Multer.File, cb) {
    cb(null, path.join(__dirname, "../../", "uploads/images"));
  },
  filename: function (req, file: Express.Multer.File, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(
      createHttpError(400, "Only image files are allowed!", {
        code: ERRORS.INVALID_FILE_TYPE,
        details: `Allowed types: ${ALLOWED_MIMETYPES.join(", ")}`,
      }),
    );
  }
  return cb(null, true);
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

const uploadImage = multer({ storage, fileFilter, limits });

export default uploadImage;
