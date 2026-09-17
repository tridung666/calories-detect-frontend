import { useMutation, useQueryClient } from "@tanstack/react-query"

import { i18n } from "@/lib/i18n/i18n"
import {
  createMeal,
  createMealItem,
  deleteMeal,
  deleteMealItem,
  updateMeal,
  updateMealItem,
} from "@/features/meals/api/meals-api"
import { mealKeys } from "@/features/meals/hooks/use-meals"
import type { MealItemRequest, MealRequest } from "@/features/meals/types/meal"
import { notification } from "@/lib/notification"

const useMealInvalidation = () => {
  const client = useQueryClient()
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: mealKeys.all }),
      client.invalidateQueries({ queryKey: ["dashboard"] }),
    ])
  }
}

export const useSaveMeal = (id?: number) => {
  const invalidate = useMealInvalidation()
  return useMutation({
    mutationFn: (payload: MealRequest) => (id ? updateMeal(id, payload) : createMeal(payload)),
    onSuccess: async () => {
      notification.success(
        id ? i18n.t("meals:notifications.updated") : i18n.t("meals:notifications.created"),
      )
      await invalidate()
    },
  })
}

export const useDeleteMeal = () => {
  const invalidate = useMealInvalidation()
  return useMutation({
    mutationFn: deleteMeal,
    onSuccess: async () => {
      notification.success(i18n.t("meals:notifications.deleted"))
      await invalidate()
    },
  })
}

export const useSaveMealItem = (mealId: number, itemId?: number) => {
  const invalidate = useMealInvalidation()
  return useMutation({
    mutationFn: (payload: MealItemRequest) =>
      itemId ? updateMealItem(mealId, itemId, payload) : createMealItem(mealId, payload),
    onSuccess: async () => {
      notification.success(
        itemId
          ? i18n.t("meals:notifications.itemUpdated")
          : i18n.t("meals:notifications.itemCreated"),
      )
      await invalidate()
    },
  })
}

export const useDeleteMealItem = (mealId: number) => {
  const invalidate = useMealInvalidation()
  return useMutation({
    mutationFn: (itemId: number) => deleteMealItem(mealId, itemId),
    onSuccess: async () => {
      notification.success(i18n.t("meals:notifications.itemDeleted"))
      await invalidate()
    },
  })
}
