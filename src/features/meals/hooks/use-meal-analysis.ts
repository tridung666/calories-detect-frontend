import { useEffect, useRef } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { analyzeMeal, confirmMealAnalysis } from "@/features/meals/api/meals-api"
import { mealKeys } from "@/features/meals/hooks/use-meals"
import type { ConfirmMealAnalysisRequest, MealAnalysis } from "@/features/meals/types/meal"
import { i18n } from "@/lib/i18n/i18n"
import { notification } from "@/lib/notification"

export const useAnalyzeMeal = (mealId: number) => {
  const controller = useRef<AbortController | null>(null)
  const mutation = useMutation({
    mutationFn: (signal: AbortSignal) => analyzeMeal(mealId, signal),
    retry: false,
  })
  useEffect(
    () => () => {
      controller.current?.abort()
    },
    [],
  )

  const start = (onSuccess: (result: MealAnalysis) => void) => {
    if (mutation.isPending) return
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    mutation.mutate(request.signal, {
      onSuccess: (result) => {
        if (!request.signal.aborted) onSuccess(result)
      },
    })
  }
  const cancel = () => {
    controller.current?.abort()
    mutation.reset()
  }
  return { ...mutation, start, cancel }
}

export const useConfirmMealAnalysis = (mealId: number) => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConfirmMealAnalysisRequest) => confirmMealAnalysis(mealId, payload),
    retry: false,
    onSuccess: async ({ items, ...meal }) => {
      await client.cancelQueries({ queryKey: mealKeys.detail(mealId) })
      client.setQueryData(mealKeys.detail(mealId), meal)
      client.setQueryData(mealKeys.items(mealId), items)
      notification.success(i18n.t("meals:analysis.saved"))
      await Promise.all([
        client.invalidateQueries({ queryKey: mealKeys.all }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ])
    },
  })
}
