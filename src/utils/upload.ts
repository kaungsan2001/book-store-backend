import cloudinary from "../config/cloudinary";
import type {
  UploadApiResponse,
  UploadApiErrorResponse,
  DeleteApiResponse,
} from "cloudinary";

type Folder = "product" | "user" | "article";

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: Folder,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined,
      ) => {
        if (error) reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};
