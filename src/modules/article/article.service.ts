import createHttpError from "http-errors";
import { ERRORS } from "../../config/constants";
import { prisma } from "../../database/db";
import type { CreateArticleInput, UpdateArticle } from "./article.schema";
import type { Article } from "../../generated/prisma/client";

/*******************
 * HELPER FUNCTION *
 *******************/
const getAuthorizeArticle = async (id: string, userId: string) => {
  const article = await prisma.article.findUnique({
    where: { id },
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

  return article;
};

/*****************************
 * CREATE AN ARTICLE SERVICE *
 *****************************/
export const createArticleService = async (
  inputs: CreateArticleInput & { imageUrl: string; imageId: string },
  userId: string,
): Promise<Article> => {
  const { title, content, tags, categoryId, imageUrl, imageId } = inputs;
  const newArticle = await prisma.article.create({
    data: {
      title,
      content,
      author: {
        connect: { id: userId },
      },
      imageUrl,
      imageId,
      category: {
        connect: { id: categoryId },
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
  const { title, content, tags, categoryId } = inputs;
  await getAuthorizeArticle(articleId, userId);

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      title,
      content,
      category: {
        connect: { id: categoryId },
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
  await getAuthorizeArticle(id, userId);

  return prisma.$transaction(async (tx) => {
    const deletedArticle = await tx.article.delete({
      where: { id },
    });
    await tx.toDeleteImage.update({
      where: { imageId: deletedArticle.imageId },
      data: { deletedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Set deletedAt to 30 days ago to force deletion during the midnight cron run.
    });
    return deletedArticle;
  });
};

/***************
 * SOFT DELETE *
 ***************/
export const softDeleteArticleService = async (
  id: string,
  userId: string,
): Promise<Article> => {
  await getAuthorizeArticle(id, userId);

  return prisma.$transaction(async (tx) => {
    const deletedArticle = await tx.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.toDeleteImage.create({
      data: {
        imageId: deletedArticle.imageId,
      },
    });

    return deletedArticle;
  });
};

/*******************
 * RESTORE - SOFT DELETED ARTICLE *
 *******************/
export const restoreArticleService = async (id: string, userId: string) => {
  await getAuthorizeArticle(id, userId);

  return prisma.$transaction(async (tx) => {
    const restored = await tx.article.update({
      where: { id },
      data: { deletedAt: null },
    });

    await tx.toDeleteImage.delete({
      where: { imageId: restored.imageId },
    });

    return restored;
  });
};
