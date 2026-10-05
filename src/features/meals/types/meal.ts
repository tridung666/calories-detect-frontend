import type { PageParams } from "@/lib/api/api-types"

export const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const
export type MealType = (typeof mealTypes)[number]
export type Meal = { id: number; mealType: MealType; mealDate: string; imageUrl?: string | null }
export type MealRequest = Pick<Meal, "mealType" | "mealDate">
export type MealFilters = PageParams & { mealDate?: string; mealType?: MealType }

export type Nutrition = {
  calories: number
  proteinGrams: number
  carbohydrateGrams: number
  fatGrams: number
}

export type MealItem = Nutrition & {
  id: number
  mealId: number
  inputName: string
  quantityGrams: number
}

export type MealItemRequest = Omit<MealItem, "id" | "mealId">

export type ConfirmedMealItem = {
  name: string
  quantityGrams: number
  calories: number
  protein: number
  carbohydrate: number
  fat: number
}

export type MealPredictionItem = Omit<ConfirmedMealItem, "quantityGrams"> & {
  estimatedGrams: number
  confidence: number
}

export type MealAnalysis = { mealId: number; items: MealPredictionItem[] }
export type ConfirmMealAnalysisRequest = { items: ConfirmedMealItem[] }
export type MealDetails = Meal & { items: MealItem[] }
