import { afterEach, expect, it } from "vitest"

import {
  analyzeMeal,
  confirmMealAnalysis,
  createMeal,
  deleteMealImage,
} from "@/features/meals/api/meals-api"
import { deleteAvatar } from "@/features/profile/api/profile-api"
import { ApiDataError } from "@/lib/api/api-error"
import { tokenStorage } from "@/lib/api/token-storage"
import { apiClient } from "@/lib/axios"

const adapter = apiClient.defaults.adapter
const item = {
  name: "Chicken",
  estimatedGrams: 150,
  calories: 248,
  protein: 46.5,
  carbohydrate: 0,
  fat: 5.4,
  confidence: 0.91,
}
afterEach(() => {
  apiClient.defaults.adapter = adapter
  tokenStorage.clearTokens()
})

it("uses the backend create route, authenticates all bridge requests and sets only analysis's long timeout", async () => {
  tokenStorage.setAccessToken("meal-token")
  const paths: string[] = []
  const signal = new AbortController().signal
  apiClient.defaults.adapter = async (config) => {
    paths.push(config.url!)
    expect(config.headers.Authorization).toBe("Bearer meal-token")
    expect(config.withCredentials).toBe(true)
    let data: unknown = { id: 123, mealType: "LUNCH", mealDate: "2026-10-05", imageUrl: null }
    if (config.url?.endsWith("/analyze")) {
      expect(config.method).toBe("post")
      expect(config.timeout).toBe(90_000)
      expect(config.signal).toBe(signal)
      expect(config.data).toBeUndefined()
      data = { mealId: 123, items: [item] }
    } else {
      expect(config.timeout).toBe(10_000)
      if (config.url?.endsWith("/confirm-analysis")) {
        expect(JSON.parse(config.data)).toEqual({
          items: [
            {
              name: "Edited chicken",
              quantityGrams: 180,
              calories: 297.6,
              protein: 55.8,
              carbohydrate: 0,
              fat: 6.48,
            },
          ],
        })
        data = { ...(data as object), items: [] }
      }
      if (config.method === "delete") expect(config.data).toBeUndefined()
    }
    return {
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: { success: true, code: 200, data },
    }
  }
  expect((await createMeal({ mealType: "LUNCH", mealDate: "2026-10-05" })).id).toBe(123)
  expect(await analyzeMeal(123, signal)).toEqual({ mealId: 123, items: [item] })
  await confirmMealAnalysis(123, {
    items: [
      {
        name: "Edited chicken",
        quantityGrams: 180,
        calories: 297.6,
        protein: 55.8,
        carbohydrate: 0,
        fat: 6.48,
      },
    ],
  })
  await deleteMealImage(123)
  await deleteAvatar()
  expect(paths).toEqual([
    "/meal",
    "/meals/123/analyze",
    "/meals/123/confirm-analysis",
    "/meals/123/image",
    "/users/me/avatar",
  ])
})

it.each([
  { mealId: 999, items: [item] },
  { mealId: 123, items: [] },
  { mealId: 123, items: [{}] },
])(
  "rejects mismatched or malformed analysis rather than showing it on the current meal",
  async (data) => {
    apiClient.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: { code: 200, data },
    })
    await expect(analyzeMeal(123)).rejects.toBeInstanceOf(ApiDataError)
  },
)
