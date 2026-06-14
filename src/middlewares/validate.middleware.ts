import type { Request, Response, NextFunction } from "express";
import z, { ZodType, ZodObject, ZodError, flattenError, success } from "zod";
import { ERRORS } from "../config/constants";

type RequestSchema = ZodObject<{
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}>;

export type ValidatedRequest<T extends RequestSchema> = Request & {
  validated?: z.infer<T>;
};

const extractFirstError = (
  fieldErrors: Record<string, string[] | undefined>,
) => {
  return (
    fieldErrors["body"]?.[0] ??
    fieldErrors["params"]?.[0] ??
    fieldErrors["query"]?.[0] ??
    "UnKnown Validation Error."
  );
};

// response format
const validationErrorResponse = (error: ZodError) => {
  const { fieldErrors, formErrors } = flattenError(error);

  return {
    success: false,
    message: "Validation Failed.",
    data: null,
    error: {
      code: ERRORS.VALIDATION_ERROR,
      details: fieldErrors,
      formErrors,
    },
  };
};
/***********************
 * MIDDLEWARE FUNCTION *
 ***********************/
export function validate<T extends RequestSchema>(schema: T) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      ...(schema.shape.body && { body: req.body }),
      ...(schema.shape.params && { params: req.params }),
      ...(schema.shape.query && { query: req.query }),
    });

    if (!result.success) {
      return res.json(validationErrorResponse(result.error));
    }

    req.validated = result.data;

    next();
  };
}
