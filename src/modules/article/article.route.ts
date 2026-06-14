import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createArticleSchema,
  DeleteArticleSchema,
  GetArticleByIdSchema,
  GetAtricleListSchema,
  UpdateArticleSchema,
} from "./article.schema";
import {
  createArticle,
  deleteArticle,
  getAllArticle,
  getArticle,
  restoreArticle,
  softDeleteArticle,
  updateArticle,
} from "./article.controller";
import upload from "../../middlewares/upload.middleware";

const router = Router();
// prefix: /api/v1/articles
router.post(
  "/create",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  upload.single("image"),
  validate(createArticleSchema),
  createArticle,
);
router.get("/", validate(GetAtricleListSchema), getAllArticle);
router.get("/:id", validate(GetArticleByIdSchema), getArticle);
router.put(
  ":/id",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  validate(UpdateArticleSchema),
  updateArticle,
);
router.delete(
  "/:id",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  validate(DeleteArticleSchema),
  deleteArticle,
);

router.put(
  "/soft/:id",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  validate(DeleteArticleSchema),
  softDeleteArticle,
);

router.put(
  "/restore/:id",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  validate(DeleteArticleSchema),
  restoreArticle,
);

export default router;
