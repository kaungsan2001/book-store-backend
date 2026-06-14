import createHttpError from "http-errors";
import { ERRORS } from "../../config/constants";
import { prisma } from "../../database/db";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema";
import type { Category } from "../../generated/prisma/client";
import { compareHash } from "../../utils/hash";

/*************************
 * CREATE CATEGORY SERVICE *
 *************************/
export const createCategoryService = async (
  inputs: CreateCategoryInput,
): Promise<Category> => {
  const { name, description } = inputs;
  const newCategory = await prisma.category.create({
    data: {
      name,
      description,
    },
  });

  return newCategory;
};

/**************************
 * GET CATEGORY BY ID SERVICE *
 **************************/
export const getCategoryById = async (id: string): Promise<Category> => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category)
    throw createHttpError(404, "Category Not Found", {
      code: ERRORS.NOT_FOUND,
    });

  return category;
};

/**********************************
 * GET ALL CATEGORIES WITH PAGINATION *
 **********************************/
export const getAllCategoriesService = async ({
  limit,
  skip,
}: {
  limit: number;
  skip: number;
}) => {
  const [totalCount, categories] = await Promise.all([
    prisma.category.count(),
    prisma.category.findMany({
      take: limit + 1,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);
  return { totalCount, categories };
};

/*************************
 * UPDATE CATEGORY SERVICE *
 *************************/
export const updateCategoryService = async ({
  inputs,
  categoryId,
}: {
  inputs: UpdateCategoryInput;
  categoryId: string;
}) => {
  const { name, description } = inputs;
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category)
    throw createHttpError(404, "Category Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      description,
    },
  });
  return updatedCategory;
};

/*************************
 * DELETE CATEGORY SERVICE *
 *************************/
export const deleteCategoryService = async (
  id: string,
  password: string,
  userId: string,
): Promise<Category> => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category)
    throw createHttpError(404, "Category Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user)
    throw createHttpError(404, "User Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  const isPasswordValid = await compareHash(password, user.password);
  if (!isPasswordValid)
    throw createHttpError(401, "Invalid Password.", {
      code: ERRORS.UNAUTHORIZED,
    });

  const deletedCategory = await prisma.category.delete({
    where: { id },
  });
  return deletedCategory;
};
