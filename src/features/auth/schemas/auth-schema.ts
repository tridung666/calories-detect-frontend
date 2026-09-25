import { z } from "zod"

import { validationKey } from "@/lib/i18n/validation"
import { emailSchema, fullNameSchema, passwordSchema } from "@/lib/validation"

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, validationKey("confirmPasswordRequired")),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: validationKey("passwordMismatch"),
    path: ["confirmPassword"],
  })

export const otpSchema = z.string().regex(/^[0-9]{6}$/, validationKey("otpInvalid"))
export const emailVerificationSchema = z.object({ otp: otpSchema })

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const requestPasswordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, validationKey("currentPasswordRequired"))
    .max(72, validationKey("passwordMax")),
})

export const passwordConfirmationSchema = z
  .object({
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: validationKey("passwordMismatch"),
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export const setPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: validationKey("passwordMismatch"),
    path: ["confirmPassword"],
  })
