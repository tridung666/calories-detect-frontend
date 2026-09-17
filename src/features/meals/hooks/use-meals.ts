import { queryOptions, useQuery } from "@tanstack/react-query"

import { getMeal, getMealItems, getMeals } from "@/features/meals/api/meals-api"
import type { MealFilters } from "@/features/meals/types/meal"

export const mealKeys = {
  all: ["meals"] as const,
  list: (filters: MealFilters) => ["meals", "list", filters] as const,
  detail: (id: number) => ["meals", id] as const,
  items: (id: number) => ["meals", id, "items"] as const,
}

export const mealItemsOptions = (mealId: number) =>
  queryOptions({
    queryKey: mealKeys.items(mealId),
    queryFn: ({ signal }) => getMealItems(mealId, signal),
  })

export const useMeals = (filters: MealFilters) =>
  useQuery({
    queryKey: mealKeys.list(filters),
    queryFn: ({ signal }) => getMeals(filters, signal),
  })

export const useMeal = (id: number) =>
  useQuery({
    queryKey: mealKeys.detail(id),
    queryFn: ({ signal }) => getMeal(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
  })

export const useMealItems = (id: number) =>
  useQuery({
    ...mealItemsOptions(id),
    enabled: Number.isSafeInteger(id) && id > 0,
  })
