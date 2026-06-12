import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createArticleSchema,
  DeleteArticleSchema,
  GetAtriclesSchema,
} from "./article.schema";
import {
  createArticle,
  deleteArticle,
  getAllArticle,
} from "./article.controller";

const router = Router();
// prefix: /api/v1/article
router.post(
  "/create",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  validate(createArticleSchema),
  createArticle,
);
router.get("/", validate(GetAtriclesSchema), getAllArticle);
// router.get("/:id");
// router.put(":/id");
router.delete(
  "/:id",
  auth,
  authorize(["ADMIN", "AUTHOR"]),
  validate(DeleteArticleSchema),
  deleteArticle,
);

export default router;
