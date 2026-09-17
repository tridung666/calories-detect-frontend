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

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, validationKey("currentPasswordRequired")),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, validationKey("confirmNewPasswordRequired")),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: validationKey("passwordMismatch"),
    path: ["confirmNewPassword"],
  })
  .refine((values) => values.newPassword !== values.oldPassword, {
    message: validationKey("passwordDifferent"),
    path: ["newPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
