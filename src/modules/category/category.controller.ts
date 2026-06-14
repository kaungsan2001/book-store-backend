import type { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { CACHE_KEYS, ERRORS } from "../../config/constants";
import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryById,
  updateCategoryService,
} from "./category.service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createCategorySchema,
  deleteCategorySchema,
  getAllCategoriesSchema,
  getCategorySchema,
  updateCategorySchema,
} from "./category.schema";
import type { ValidatedRequest } from "../../middlewares/validate.middleware";
import { getCache, setCache } from "../../utils/cache";

/*************************
 * CREATE CATEGORY CONTROLLER *
 *************************/
export const createCategory = async (
  req: AuthenticatedRequest & ValidatedRequest<typeof createCategorySchema>,
  res: Response,
) => {
  const { name, description } = req.validated!.body;

  const category = await createCategoryService({
    name,
    description,
  });

  await setCache({
    key: `${CACHE_KEYS.CATEGORIES}${category.id}`,
    exp: 3600,
    data: category,
  });

  sendResponse({
    res,
    data: { category },
    message: "New Category Created.",
    statusCode: 201,
  });
};

/*************************
 * GET CATEGORY BY ID CONTROLLER *
 *************************/
export const getCategory = async (req: Request, res: Response) => {
  const categoryId = req.params.id as string;
  const cache = await getCache(`${CACHE_KEYS.CATEGORIES}${categoryId}`);

  if (cache) {
    return sendResponse({
      res,
      data: { category: cache },
      message: "Category",
    });
  }

  const category = await getCategoryById(categoryId);

  await setCache({
    key: `${CACHE_KEYS.CATEGORIES}${categoryId}`,
    exp: 3600,
    data: category,
  });

  sendResponse({ res, data: { category }, message: "Category" });
};

/**********************************************
 * GET ALL CATEGORIES WITH PAGINATION CONTROLLER *
 **********************************************/
export const getAllCategories = async (
  req: ValidatedRequest<typeof getAllCategoriesSchema>,
  res: Response,
) => {
  const { page, limit } = req.validated!.query;
  const skip = (page - 1) * limit;

  const cache = await getCache(`${CACHE_KEYS.CATEGORIES}${limit}${skip}`);

  if (cache) {
    return sendResponse({
      res,
      message: "Categories List",
      data: cache.categories,
      meta: cache.meta,
    });
  }

  const { totalCount, categories } = await getAllCategoriesService({
    limit,
    skip,
  });

  const hasNextPage = categories.length > limit;
  const nextPage = hasNextPage ? page + 1 : null;
  const previousPage = page !== 1 ? page - 1 : null;
  const totalPage = Math.ceil(totalCount / limit);

  if (hasNextPage) {
    categories.pop();
  }

  const meta = {
    hasNextPage,
    nextPage,
    previousPage,
    currentPage: page,
    totalPage,
  };

  await setCache({
    key: `${CACHE_KEYS.CATEGORIES}${limit}${skip}`,
    exp: 3600,
    data: { categories, meta },
  });

  sendResponse({
    res,
    message: "Categories List",
    data: categories,
    meta,
  });
};

/*************************
 * UPDATE CATEGORY CONTROLLER *
 *************************/
export const updateCategory = async (
  req: AuthenticatedRequest & ValidatedRequest<typeof updateCategorySchema>,
  res: Response,
) => {
  const updatedCategory = await updateCategoryService({
    inputs: req.validated!.body,
    categoryId: req.validated!.params.id,
  });

  sendResponse({
    res,
    data: { category: updatedCategory },
    message: "Updated Category",
  });
};

/*************************
 * DELETE CATEGORY CONTROLLER *
 *************************/
export const deleteCategory = async (
  req: AuthenticatedRequest & ValidatedRequest<typeof deleteCategorySchema>,
  res: Response,
) => {
  const categoryId = req.validated!.params.id;
  const { password } = req.validated!.body;
  const userId = req.user!.id;

  const category = await deleteCategoryService(categoryId, password, userId);

  sendResponse({ res, data: { category }, message: "Category Deleted." });
};
