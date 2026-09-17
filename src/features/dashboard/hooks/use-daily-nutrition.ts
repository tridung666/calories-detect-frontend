import { useQueries, useQuery } from "@tanstack/react-query"

import { getDailyMeals } from "@/features/dashboard/api/dashboard-api"
import { mealItemsOptions } from "@/features/meals/hooks/use-meals"
import { sumNutrition } from "@/features/meals/lib/meal-utils"

export const useDailyNutrition = (date: string) => {
  const meals = useQuery({
    queryKey: ["dashboard", date],
    queryFn: ({ signal }) => getDailyMeals(date, signal),
  })
  const itemQueries = useQueries({
    queries: (meals.data ?? []).map((meal) => mealItemsOptions(meal.id)),
  })
  const error = meals.error ?? itemQueries.find((query) => query.isError)?.error
  const entries = (meals.data ?? []).map((meal, index) => ({
    meal,
    items: itemQueries[index]?.data ?? [],
  }))
  return {
    entries,
    nutrition: sumNutrition(entries.flatMap((entry) => entry.items)),
    isPending: meals.isPending || itemQueries.some((query) => query.isPending),
    isFetching: meals.isFetching || itemQueries.some((query) => query.isFetching),
    error,
    refetch: () => {
      void meals.refetch()
      itemQueries.forEach((query) => {
        void query.refetch()
      })
    },
  }
}
