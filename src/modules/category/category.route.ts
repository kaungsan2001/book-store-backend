import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createCategorySchema,
  deleteCategorySchema,
  getAllCategoriesSchema,
  getCategorySchema,
  updateCategorySchema,
} from "./category.schema";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategory,
  updateCategory,
} from "./category.controller";

const router = Router();

router.post(
  "/create",
  auth,
  authorize(["ADMIN"]),
  validate(createCategorySchema),
  createCategory,
);

router.get("/", validate(getAllCategoriesSchema), getAllCategories);

router.get("/:id", validate(getCategorySchema), getCategory);

router.put(
  "/:id",
  auth,
  authorize(["ADMIN"]),
  validate(updateCategorySchema),
  updateCategory,
);

router.delete(
  "/:id",
  auth,
  authorize(["ADMIN"]),
  validate(deleteCategorySchema),
  deleteCategory,
);

export default router;
