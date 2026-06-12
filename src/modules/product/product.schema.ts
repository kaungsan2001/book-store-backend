import z from "zod";

export const GetOneSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Product Id." }),
  }),
});
export type GetOneType = z.infer<typeof GetOneSchema>["params"];

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.cuid2({ error: "Invalid Product Id." }),
  }),
});

export type DeleteProductType = z.infer<typeof DeleteProductSchema>["params"];
