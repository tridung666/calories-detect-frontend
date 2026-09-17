import { z } from "zod"

import { validationKey } from "@/lib/i18n/validation"
import { mealTypes } from "@/features/meals/types/meal"
import { dateSchema, nonNegativeIntegerSchema } from "@/lib/validation"

export const mealSchema = z.object({
  mealType: z.enum(mealTypes, { error: validationKey("mealTypeRequired") }),
  mealDate: dateSchema,
})

export const mealItemSchema = z.object({
  inputName: z
    .string()
    .trim()
    .min(1, validationKey("foodNameRequired"))
    .max(255, validationKey("foodNameMax")),
  normalizedName: z.string().trim().max(255, validationKey("foodNameMax")),
  quantityGrams: z
    .number({ error: validationKey("quantityRequired") })
    .positive(validationKey("quantityPositive"))
    .max(99_999_999.99, validationKey("quantityMax"))
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
      validationKey("quantityPrecision"),
    ),
  calories: nonNegativeIntegerSchema,
  proteinGrams: nonNegativeIntegerSchema,
  carbohydrateGrams: nonNegativeIntegerSchema,
  fatGrams: nonNegativeIntegerSchema,
})

export type MealFormValues = z.infer<typeof mealSchema>
export type MealItemFormValues = z.infer<typeof mealItemSchema>
