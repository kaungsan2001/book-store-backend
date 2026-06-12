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

/*******************
 * REGISTER SCHEMA *
 *******************/
export const RegisterSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid Email" }).trim().toLowerCase(),
    })
    .strict(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];

/*********************
 * VERIFY OTP SCHEMA *
 *********************/
export const VerifyOtpSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid Email" }).trim().toLowerCase(),

      token: z
        .string({ error: "Invalid Token" })
        .trim()
        .min(2, { error: "Invalid Token" })
        .transform(escapeHtml),

      code: z
        .string({ error: "Invalid OTP Code" })
        .trim()
        .regex(/^\d{6}$/, { message: "OTP code must be exactly 6 digits" }),
    })
    .strict(),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>["body"];

/***************************
 * CONFIRM PASSWORD SCHEMA *
 ***************************/
export const ConfirmPasswordSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid Email" }).trim().toLowerCase(),
      password: z
        .string({ error: "Password must be string" })
        .trim()
        .min(6, { error: "Password must be at least 6 characters long" }),
      token: z
        .string({ error: "Invalid Token" })
        .trim()
        .min(2, { error: "Invalid Token" })
        .transform(escapeHtml),
    })
    .strict(),
});

export type ConfirmPasswordInput = z.infer<
  typeof ConfirmPasswordSchema
>["body"];

/****************
 * LOGIN SCHEMA *
 ****************/
export const LoginSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid Email" }).trim().toLowerCase(),
      password: z
        .string({ error: "Password must be a string" })
        .min(6, { error: "Password must be at least 6 characters long" }),
    })
    .strict(),
});

export type LoginInput = z.infer<typeof LoginSchema>["body"];

/********************************
 * VERIFY RESET PASSWORD SCHEMA *
 ********************************/
export const VerifyResetPasswordSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid Email" }).trim().toLowerCase(),

      token: z
        .string({ error: "Invalid Token" })
        .trim()
        .min(2, { error: "Invalid Token" })
        .transform(escapeHtml),

      code: z
        .string({ error: "Invalid OTP Code" })
        .trim()
        .regex(/^\d{6}$/, { message: "OTP code must be exactly 6 digits" }),
    })
    .strict(),
});

export type VerifyResetPassword = z.infer<
  typeof VerifyResetPasswordSchema
>["body"];

/*************************
 * RESET PASSWORD SCHEMA *
 *************************/
export const ResetPasswordSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid Email" }).trim().toLowerCase(),

      token: z
        .string({ error: "Invalid Token" })
        .trim()
        .min(2, { error: "Invalid Token" })
        .transform(escapeHtml),

      password: z
        .string({ error: "Password must be a string." })
        .trim()
        .min(6, { error: "Password must be at least 6 characters long." }),
    })
    .strict(),
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>["body"];
