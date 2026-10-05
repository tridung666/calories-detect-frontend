import type {
  Meal,
  MealFilters,
  MealItem,
  MealItemRequest,
  MealRequest,
  ConfirmMealAnalysisRequest,
  MealDetails,
} from "@/features/meals/types/meal"
import { mealAnalysisSchema } from "@/features/meals/schemas/meal-schema"
import { ApiDataError } from "@/lib/api/api-error"
import type { ApiSuccessResponse, BackendPageResponse } from "@/lib/api/api-types"
import { normalizePage, toPageParams } from "@/lib/api/pagination"
import { apiClient } from "@/lib/axios"
import { imageFormData, imageUploadConfig } from "@/lib/api/image-upload"

export const uploadMealImage = async (mealId: number, file: File) => {
  const response = await apiClient.put<ApiSuccessResponse<Meal>>(
    `/meals/${mealId}/image`,
    imageFormData(file),
    imageUploadConfig,
  )
  return response.data.data
}

export const getMeals = async ({ page, size, ...filters }: MealFilters, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiSuccessResponse<BackendPageResponse<Meal>>>("/meal", {
    params: { ...toPageParams({ page, size }), ...filters },
    signal,
  })
  return normalizePage(response.data.data)
}

export const getMeal = async (id: number, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiSuccessResponse<Meal>>(`/meal/${id}`, { signal })
  return response.data.data
}

export const createMeal = async (payload: MealRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<Meal>>("/meal", payload)
  return response.data.data
}

export const deleteMealImage = async (mealId: number) => {
  const response = await apiClient.delete<ApiSuccessResponse<Meal>>(`/meals/${mealId}/image`)
  return response.data.data
}

export const analyzeMeal = async (mealId: number, signal?: AbortSignal) => {
  const response = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/meals/${mealId}/analyze`,
    undefined,
    { timeout: 90_000, signal },
  )
  const result = mealAnalysisSchema.safeParse(response.data.data)
  if (!result.success || result.data.mealId !== mealId) throw new ApiDataError("aiInvalidResponse")
  return result.data
}

export const confirmMealAnalysis = async (mealId: number, payload: ConfirmMealAnalysisRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<MealDetails>>(
    `/meals/${mealId}/confirm-analysis`,
    payload,
  )
  return response.data.data
}

export const updateMeal = async (id: number, payload: MealRequest) => {
  const response = await apiClient.put<ApiSuccessResponse<Meal>>(`/meal/${id}`, payload)
  return response.data.data
}

export const deleteMeal = async (id: number) => {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(`/meal/${id}`)
  return response.data.data
}

export const getMealItems = async (mealId: number, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiSuccessResponse<MealItem[]>>(`/meal/${mealId}/items`, {
    signal,
  })
  return response.data.data
}

export const createMealItem = async (mealId: number, payload: MealItemRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<MealItem>>(
    `/meal/${mealId}/items`,
    payload,
  )
  return response.data.data
}

export const updateMealItem = async (mealId: number, itemId: number, payload: MealItemRequest) => {
  const response = await apiClient.put<ApiSuccessResponse<MealItem>>(
    `/meal/${mealId}/items/${itemId}`,
    payload,
  )
  return response.data.data
}

export const deleteMealItem = async (mealId: number, itemId: number) => {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/meal/${mealId}/items/${itemId}`,
  )
  return response.data.data
}
