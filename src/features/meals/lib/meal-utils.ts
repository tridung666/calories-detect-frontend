import { Apple, Coffee, Moon, Sun } from "lucide-react"

import type { MealType, Nutrition } from "@/features/meals/types/meal"

export const mealTypeInfo = {
  BREAKFAST: {
    labelKey: "meals:types.BREAKFAST",
    icon: Coffee,
    className: "bg-chart-1/10 text-chart-1",
  },
  LUNCH: {
    labelKey: "meals:types.LUNCH",
    icon: Sun,
    className: "bg-chart-2/10 text-chart-2",
  },
  DINNER: {
    labelKey: "meals:types.DINNER",
    icon: Moon,
    className: "bg-chart-3/10 text-chart-3",
  },
  SNACK: {
    labelKey: "meals:types.SNACK",
    icon: Apple,
    className: "bg-chart-4/10 text-chart-4",
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
