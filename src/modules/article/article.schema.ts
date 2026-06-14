import { z } from "zod";
import sanitizeHtml from "sanitize-html";

/**
 * Helper function to sanitizes input strings by converting
 * HTML special characters into safe HTML entities.
 *
 * Target characters ->  & , ' , " , / , < , >
 *
 * This mitigates XSS vulnerabilities when rendering user inputs.
 *
 * @param {string} value  - raw string to sanitize
 * @returns  {string}     - sanitized string that safe to render
 */
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

/****************************
 * CREATE AN ARTICLE SCHEMA *
 ****************************/

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").transform(escapeHtml),
    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .transform((content) => sanitizeHtml(content))
      .refine((sanitizied) => sanitizied.trim().length > 0, {
        error: "Content is required.",
      }),
    categoryId: z.cuid2({ error: "Category Id must be a valid Id" }),
    tags: z
      .array(z.string(), { error: "Tags must be a string array" })
      .optional(),
  }),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>["body"];

export const GetArticleByIdSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Article ID." }),
  }),
});

export type GetArticleByIdInput = z.infer<
  typeof GetArticleByIdSchema
>["params"];

/********************************
 * GET ARTICLES WITH PAGINATION SCHEMA*
 ********************************/
export const GetAtricleListSchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().catch(1), //safely falls back to 1 if missing, empty, or invalid.
    limit: z.coerce.number().positive().catch(10),
  }),
});

export type GetAtricleList = z.infer<typeof GetAtricleListSchema>["query"];

/*************************
 * UPDATE ARTICLE SCHEMA *
 *************************/
export const UpdateArticleSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Article ID." }),
  }),
  body: z.object({
    title: z.string().trim().min(1, "Title is required").transform(escapeHtml),
    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .transform((content) => sanitizeHtml(content))
      .refine((sanitizied) => sanitizied.trim().length > 0, {
        error: "Content is required.",
      }),
    categoryId: z.cuid2({ error: "Category ID is required" }),
    tags: z
      .array(z.string().trim(), { error: "Tags must be a string array" })
      .optional()
      .transform((tags) => tags?.filter((t) => t !== "")),
  }),
});

export type UpdateArticle = z.infer<typeof UpdateArticleSchema>["body"];

/****************************
 * DELETE AN ARTICLE SCHEMA *
 ****************************/
export const DeleteArticleSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Article ID." }),
  }),
});

export type DeleteArticle = z.infer<typeof DeleteArticleSchema>["params"];

export const RestoreArticleSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Article ID." }),
  }),
});

export type RestoreArticle = z.infer<typeof RestoreArticleSchema>["params"];
