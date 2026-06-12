import createHttpError from "http-errors";
import { ERRORS } from "../../config/constants";
import { prisma } from "../../database/db";
import type {
  CreateArticleInput,
  GetArticles,
  UpdateArticle,
} from "./article.schema";
import type { Article } from "../../generated/prisma/client";

/*****************************
 * CREATE AN ARTICLE SERVICE *
 *****************************/
export const createArticleService = async (
  inputs: CreateArticleInput,
  userId: string,
): Promise<Article> => {
  const { title, content, tags, category } = inputs;
  const newArticle = await prisma.article.create({
    data: {
      title,
      content,
      author: {
        connect: { id: userId },
      },
      category: {
        connectOrCreate: {
          where: { name: category },
          create: { name: category },
        },
      },
      tags:
        tags && tags.length > 0
          ? {
              // new Set() -> to removes duplicate items from array
              connectOrCreate: [...new Set(tags)].map((t) => {
                return { where: { name: t }, create: { name: t } };
              }),
            }
          : undefined,
    },
  });

  return newArticle;
};

/********************************
 * GET AN ARTICLE BY ID SERVICE *
 ********************************/
export const getArticleByIdService = async (id: string): Promise<Article> => {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!article)
    throw createHttpError(404, "Article Not Found", {
      code: ERRORS.NOT_FOUND,
    });

  return article;
};

/**********************************
 * GET ALL ARTICLES BY PAGINATION *
 **********************************/
export const getAllArticleService = async ({
  limit,
  skip,
}: {
  limit: number;
  skip: number;
}) => {
  const [totalCount, articles] = await Promise.all([
    prisma.article.count(),
    prisma.article.findMany({
      take: limit + 1,
      skip,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);
  return { totalCount, articles };
};

/***************************
 * UPDATE AN ARTICLE BY ID SERVICE*
 ***************************/
export const updateArticleService = async ({
  inputs,
  articleId,
  userId,
}: {
  inputs: UpdateArticle;
  articleId: string;
  userId: string;
}) => {
  const { title, content, tags, category } = inputs;
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });

  if (!article)
    throw createHttpError(404, "Article Not Found.", {
      code: ERRORS.NOT_FOUND,
    });
  if (article.authorId !== userId)
    throw createHttpError(403, "Unauthorize", {
      code: ERRORS.FORBIDDEN,
    });

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      title,
      content,
      category: {
        connect: { name: category },
      },
      tags:
        tags && tags.length > 0
          ? {
              // new Set() -> to removes duplicate items from array
              connectOrCreate: [...new Set(tags)].map((t) => {
                return { where: { name: t }, create: { name: t } };
              }),
            }
          : undefined,
    },
  });
  return updatedArticle;
};

/***********************************
 * DELETE AN ARTICLE BY ID SERVICE *
 ***********************************/
export const deleteArticleService = async (
  id: string,
  userId: string,
): Promise<Article> => {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article)
    throw createHttpError(404, "Article Not Found.", {
      code: ERRORS.NOT_FOUND,
    });
  if (article.authorId !== userId)
    throw createHttpError(403, "Unauthorized", {
      code: ERRORS.FORBIDDEN,
    });
  return await prisma.article.delete({
    where: { id },
  });
};
