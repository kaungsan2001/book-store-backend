import { ERRORS } from "../../config/constants";
import { prisma } from "../../database/db";
import createHttpError from "http-errors";
import type { Product } from "../../generated/prisma/client";

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
export const create = async () => {};

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
