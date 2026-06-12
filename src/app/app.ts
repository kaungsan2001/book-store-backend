import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import * as middleware from "i18next-http-middleware";
import path from "path";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { ERRORS } from "../config/constants";
import createHttpError from "http-errors";

const app = express();

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",

    backend: {
      loadPath: path.join(
        process.cwd(),
        "src/locales",
        "{{lng}}",
        "{{ns}}.json",
      ),
    },
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
    },
    preload: ["en", "mm"],
  });

const whitelist = [process.env.FRONTEND_URL];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      return callback(
        createHttpError(403, "Not allowed by CORS", {
          code: ERRORS.CORS_ERROR,
        }),
      );
    }
  },
  credentials: true,
};

app
  .use(cors(corsOptions))
  .use(cookieParser())
  .use(express.json())
  .use(middleware.handle(i18next))
  .use(express.static("uploads/images"))
  .use(routes)

  .use(errorHandler);

export default app;

// global error handler middleware
function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    message: message,
    data: null,
    error: {
      code: err.code || ERRORS.INTERNAL_SERVER_ERROR,
      details: err.details || null,
      ...(process.env.NODE_ENV === "production" && { stack: err.stack }),
    },
  });
}
