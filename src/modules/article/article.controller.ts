import type { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { CACHE_KEYS } from "../../config/constants";

import {
  createArticleService,
  deleteArticleService,
  getAllArticleService,
  getArticleByIdService,
  updateArticleService,
} from "./article.service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  createArticleSchema,
  DeleteArticleSchema,
  GetAtriclesSchema,
  UpdateArticleSchema,
} from "./article.schema";
import type { ValidatedRequest } from "../../middlewares/validate.middleware";
import { getCache, setCache } from "../../utils/cache";

/*****************************
 * CREATE ARTICLE CONTROLLER *
 *****************************/
export const createArticle = async (
  req: AuthenticatedRequest & ValidatedRequest<typeof createArticleSchema>,
  res: Response,
) => {
  const { title, content, category, tags } = req.validated!.body;
  const userId = req.user!.id;

  const article = await createArticleService(
    {
      title,
      content,
      category,
      tags,
    },
    userId,
  );
  await setCache({
    key: `${CACHE_KEYS.ARTICLES}+${article.id}`,
    exp: 3600,
    data: article,
  });
  sendResponse({
    res,
    data: { article },
    message: "New Article Created.",
    statusCode: 201,
  });
};

/***********************************
 * GET AN ARTICLE BY ID CONTROLLER *
 ***********************************/
export const getArticle = async (req: Request, res: Response) => {
  const articleId = req.params.id as string;
  const cache = await getCache(`${CACHE_KEYS.ARTICLES}+${articleId}`);

  if (cache) {
    return sendResponse({ res, data: { article: cache }, message: "Article" });
  }
  const article = await getArticleByIdService(articleId);

  await setCache({
    key: `${CACHE_KEYS.ARTICLES}+${articleId}`,
    exp: 3600,
    data: article,
  });

  sendResponse({ res, data: { article }, message: "Article" });
};

/**********************************************
 * GET ALL ARTICLES WITH PAGINATION CONTROLLER *
 **********************************************/
export const getAllArticle = async (
  req: ValidatedRequest<typeof GetAtriclesSchema>,
  res: Response,
) => {
  const { page, limit } = req.validated!.query;
  const skip = (page - 1) * limit;

  const cache = await getCache(`${CACHE_KEYS.ARTICLES}+${limit}+${skip}`);

  if (cache) {
    return sendResponse({
      res,
      message: "Articles List",
      data: cache.articles,
      meta: cache.meta,
    });
  }
  const { totalCount, articles } = await getAllArticleService({ limit, skip });

  const hasNextPage = articles.length > limit;
  const nextPage = hasNextPage ? page + 1 : null;
  const previousPage = page !== 1 ? page - 1 : null;
  const totalPage = Math.ceil(totalCount / limit); // Math.ceil() -> to avoid decimal numbers

  if (hasNextPage) {
    articles.pop();
  }

  const meta = {
    hasNextPage,
    nextPage,
    previousPage,
    currentPage: page,
    totalPage,
  };

  await setCache({
    key: `${CACHE_KEYS.ARTICLES}+${limit}+${skip}`,
    exp: 3600,
    data: { articles, meta },
  });

  sendResponse({
    res,
    message: "Articles List",
    data: articles,
    meta,
  });
};

/***************************
 * UPDATE AN ARTICLE BY ID CONTROLLER *
 ***************************/
export const updateArticle = async (
  req: AuthenticatedRequest & ValidatedRequest<typeof UpdateArticleSchema>,
  res: Response,
) => {
  const updatedArticle = await updateArticleService({
    inputs: req.validated!.body,
    articleId: req.validated!.params.id,
    userId: req.user!.id,
  });

  sendResponse({
    res,
    data: { article: updatedArticle },
    message: "Updated Article",
  });
};

/**************************************
 * DELETE AN ARTICLE BY ID CONTROLLER *
 **************************************/
export const deleteArticle = async (
  req: AuthenticatedRequest & ValidatedRequest<typeof DeleteArticleSchema>,
  res: Response,
) => {
  const articleId = req.validated!.params.id;
  const userId = req.user!.id;

  const article = await deleteArticleService(articleId, userId);

  sendResponse({ res, data: { article }, message: "Article Deleted." });
};
