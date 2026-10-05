import { z } from "zod"

import { validationKey } from "@/lib/i18n/validation"
import { mealTypes } from "@/features/meals/types/meal"
import { dateSchema, hasTwoDecimalPlaces, nutritionValueSchema } from "@/lib/validation"

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
  quantityGrams: z
    .number({ error: validationKey("quantityRequired") })
    .positive(validationKey("quantityPositive"))
    .max(99_999_999.99, validationKey("quantityMax"))
    .refine(hasTwoDecimalPlaces, validationKey("quantityPrecision")),
  calories: nutritionValueSchema,
  proteinGrams: nutritionValueSchema,
  carbohydrateGrams: nutritionValueSchema,
  fatGrams: nutritionValueSchema,
})

export const confirmedMealItemSchema = z.object({
  name: mealItemSchema.shape.inputName,
  quantityGrams: mealItemSchema.shape.quantityGrams,
  calories: nutritionValueSchema,
  protein: nutritionValueSchema,
  carbohydrate: nutritionValueSchema,
  fat: nutritionValueSchema,
})

export const mealAnalysisSchema = z.object({
  mealId: z.number().int().positive(),
  items: z
    .array(
      confirmedMealItemSchema.omit({ quantityGrams: true }).extend({
        estimatedGrams: mealItemSchema.shape.quantityGrams,
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1),
})

export const mealAnalysisReviewSchema = z.object({
  items: z
    .array(
      confirmedMealItemSchema.extend({
        sourceIndex: z.number().int().nonnegative().optional(),
      }),
    )
    .min(1, validationKey("foodsRequired")),
})

export type MealFormValues = z.infer<typeof mealSchema>
export type MealItemFormValues = z.infer<typeof mealItemSchema>
export type MealAnalysisReviewValues = z.infer<typeof mealAnalysisReviewSchema>
