import { z } from "zod"

import { validationKey } from "@/lib/i18n/validation"
import { emailSchema, fullNameSchema, passwordSchema } from "@/lib/validation"

export const adminUserSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  password: passwordSchema,
  role: z.enum(["USER", "ADMIN"], { error: validationKey("roleRequired") }),
})

export type AdminUserFormValues = z.infer<typeof adminUserSchema>
