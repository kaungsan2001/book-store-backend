import z from "zod";

export const GetOneSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Product Id." }),
  }),
});
export type GetOneType = z.infer<typeof GetOneSchema>["params"];

/*******************************
 * CREATE PRODUCT INPUT SCHEMA *
 *******************************/

export const CreateProductSchema = z.object({
  body: z.object({
    name: z
      .string({
        error: "Product name must be text",
      })
      .min(1, "Product name cannot be empty"),

    description: z
      .string({
        error: "Description must be text",
      })
      .min(1, "Description cannot be empty"),

    price: z.coerce
      .number({
        error: "Price must be a valid number",
      })
      .positive("Price must be greater than zero"),

    discount: z.coerce
      .number({
        error: "Discount must be a valid number",
      })
      .min(0, "Discount cannot be negative"),

    inventory: z.coerce
      .number({
        error: "Inventory must be a valid whole number",
      })
      .int("Inventory must be a whole number")
      .min(0, "Inventory cannot be negative"),

    categoryId: z.cuid2({
      message: "Category ID must be a valid identifier",
    }),

    productTag: z.array(z.string({ error: "Each tag must be text" }), {
      error: "Product tags must be a list of items",
    }),
  }),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>["body"];

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Product Id." }),
  }),
});

export type DeleteProductType = z.infer<typeof DeleteProductSchema>["params"];
