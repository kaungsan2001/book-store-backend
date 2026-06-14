import { ERRORS } from "../../config/constants";
import { prisma } from "../../database/db";
import createHttpError from "http-errors";
import type { Product } from "../../generated/prisma/client";
import type { CreateProductInput } from "./product.schema";

/*****************************
 * GET PRODUCT BY ID SERVICE *
 *****************************/
export const getProductById = async (id: string): Promise<Product | null> => {
  return await prisma.product.findUnique({
    where: { id },
  });
};
/********************************************
 * GET PRODUCT LIST BY PAGINATION SERVICE *
 ********************************************/
export const getProductList = async ({
  limit,
  skip,
}: {
  limit: number;
  skip: number;
}): Promise<Product[] | []> => {
  return await prisma.product.findMany({
    take: limit + 1,
    skip,
  });
};

/******************************
 * CREATE NEW PRODUCT SERVICE *
 ******************************/
export const createProduct = async (
  data: CreateProductInput,
): Promise<Product> => {
  return await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      discount: data.discount,
      inventory: data.inventory,
      category: {
        connect: {
          id: data.categoryId,
        },
      },
      productTag:
        data.productTag.length > 0
          ? {
              connectOrCreate: [...new Set(data.productTag)].map((t) => ({
                where: { name: t },
                create: { name: t },
              })),
            }
          : undefined,
    },
  });
};

/********************************
 * UPDATE PRODUCT BY ID SERVICE *
 ********************************/
export const update = async () => {};

/********************************
 * DELETE PRODUCT BY ID SERVICE *
 ********************************/
export const deleteProductById = async (
  id: string,
): Promise<Product | void> => {
  const product = await getProductById(id);
  if (!product)
    throw createHttpError(404, "Resource Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  return await prisma.product.delete({ where: { id } });
};

/***************
 * SOFT DELETE *
 ***************/
export const softDeleteProductById = async (
  id: string,
): Promise<Product | void> => {
  const product = await getProductById(id);
  if (!product)
    throw createHttpError(404, "Resource Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return deletedProduct;
};

/***********
 * RESTORE *
 ***********/
export const restoreProductById = async (
  id: string,
): Promise<Product | void> => {
  const product = await getProductById(id);
  if (!product)
    throw createHttpError(404, "Resource Not Found.", {
      code: ERRORS.NOT_FOUND,
    });

  return await prisma.product.update({
    where: { id },
    data: { deletedAt: null },
  });
};
