import { z } from "zod"

import { validationKey } from "@/lib/i18n/validation"
import { emailSchema } from "@/lib/validation"

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, validationKey("passwordRequired")),
})

export type LoginFormValues = z.infer<typeof loginSchema>
