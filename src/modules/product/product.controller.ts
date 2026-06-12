import type { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { deleteProductById, getProductById } from "./product.service";
import type { ValidatedRequest } from "../../middlewares/validate.middleware";
import type { DeleteProductSchema, GetOneSchema } from "./product.schema";

/*****************
 * GET A PRODUCT *
 *****************/
export const getOne = async (
  req: ValidatedRequest<typeof GetOneSchema>,
  res: Response,
) => {
  const id = req.validated!.params.id;
  const product = await getProductById(id);
  sendResponse({ res, data: { product }, message: "Product" });
};

/********************
 * GET PRODUCT LIST *
 ********************/
export const getMany = async (req: Request, res: Response) => {};

/**********************
 * CREATE NEW PRODUCT *
 **********************/
export const create = async (req: Request, res: Response) => {};

/************************
 * UPDATE PRODUCT BY ID *
 ************************/
export const update = async (req: Request, res: Response) => {};

/************************
 * DELETE PRODUCT BY ID *
 ************************/
export const remove = async (
  req: ValidatedRequest<typeof DeleteProductSchema>,
  res: Response,
) => {
  const id = req.validated!.params.id;
  const product = await deleteProductById(id);
  sendResponse({ res, data: { product }, message: "A Product Deleted" });
};
