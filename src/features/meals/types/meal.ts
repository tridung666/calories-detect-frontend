import type { PageParams } from "@/lib/api/api-types"

export const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const
export type MealType = (typeof mealTypes)[number]
export type Meal = { id: number; mealType: MealType; mealDate: string }
export type MealRequest = Omit<Meal, "id">
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
  normalizedName: string | null
  quantityGrams: number
}

export type MealItemRequest = Omit<MealItem, "id" | "mealId">
