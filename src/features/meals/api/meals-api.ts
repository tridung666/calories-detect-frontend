import type {
  Meal,
  MealFilters,
  MealItem,
  MealItemRequest,
  MealRequest,
} from "@/features/meals/types/meal"
import type { ApiResponse, BackendPageResponse } from "@/lib/api/api-types"
import { normalizePage, toPageParams } from "@/lib/api/pagination"
import { apiClient } from "@/lib/axios"

export const getMeals = async ({ page, size, ...filters }: MealFilters, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiResponse<BackendPageResponse<Meal>>>("/meal", {
    params: { ...toPageParams({ page, size }), ...filters },
    signal,
  })
  return normalizePage(response.data.data)
}

export const getMeal = async (id: number, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiResponse<Meal>>(`/meal/${id}`, { signal })
  return response.data.data
}

export const createMeal = async (payload: MealRequest) => {
  const response = await apiClient.post<ApiResponse<Meal>>("/meal/create", payload)
  return response.data.data
}

export const updateMeal = async (id: number, payload: MealRequest) => {
  const response = await apiClient.put<ApiResponse<Meal>>(`/meal/${id}`, payload)
  return response.data.data
}

export const deleteMeal = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/meal/${id}`)
  return response.data.data
}

export const getMealItems = async (mealId: number, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiResponse<MealItem[]>>(`/meal/${mealId}/items`, { signal })
  return response.data.data
}

export const createMealItem = async (mealId: number, payload: MealItemRequest) => {
  const response = await apiClient.post<ApiResponse<MealItem>>(`/meal/${mealId}/items`, payload)
  return response.data.data
}

export const updateMealItem = async (mealId: number, itemId: number, payload: MealItemRequest) => {
  const response = await apiClient.put<ApiResponse<MealItem>>(
    `/meal/${mealId}/items/${itemId}`,
    payload,
  )
  return response.data.data
}

export const deleteMealItem = async (mealId: number, itemId: number) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/meal/${mealId}/items/${itemId}`)
  return response.data.data
}
