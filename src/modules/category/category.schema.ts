import { z } from "zod";

const escapeHtml = (value: string): string => {
  return value.replace(/[&<>"'/]/g, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#x27;";
      case "/":
        return "&#x2F;";
      default:
        return match;
    }
  });
};

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").transform(escapeHtml),
    description: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val ? escapeHtml(val) : undefined)),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];

export const getCategorySchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Category ID." }),
  }),
});

export type GetCategory = z.infer<typeof getCategorySchema>["params"];

export const getAllCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().catch(1),
    limit: z.coerce.number().positive().catch(10),
  }),
});

export type GetAllCategories = z.infer<typeof getAllCategoriesSchema>["query"];

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Category ID." }),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .transform(escapeHtml)
      .optional(),
    description: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val ? escapeHtml(val) : undefined)),
  }),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Category ID." }),
  }),
  body: z.object({
    password: z.string().min(1, "Password is required"),
  }),
});

export type DeleteCategory = z.infer<typeof deleteCategorySchema>["params"] & {
  body: z.infer<typeof deleteCategorySchema>["body"];
};
