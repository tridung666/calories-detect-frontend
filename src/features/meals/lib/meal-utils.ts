import { Apple, Coffee, Moon, Sun } from "lucide-react"

import type { MealType, Nutrition } from "@/features/meals/types/meal"

export const mealTypeInfo = {
  BREAKFAST: {
    labelKey: "meals:types.BREAKFAST",
    icon: Coffee,
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  LUNCH: {
    labelKey: "meals:types.LUNCH",
    icon: Sun,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  DINNER: {
    labelKey: "meals:types.DINNER",
    icon: Moon,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  SNACK: {
    labelKey: "meals:types.SNACK",
    icon: Apple,
    className: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
} as const satisfies Record<
  MealType,
  { labelKey: `meals:types.${MealType}`; icon: typeof Coffee; className: string }
>

// API nutrition values already describe the entire portion; never multiply by weight.
export const sumNutrition = (items: Nutrition[]): Nutrition =>
  items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      proteinGrams: total.proteinGrams + item.proteinGrams,
      carbohydrateGrams: total.carbohydrateGrams + item.carbohydrateGrams,
      fatGrams: total.fatGrams + item.fatGrams,
    }),
    { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
  )
