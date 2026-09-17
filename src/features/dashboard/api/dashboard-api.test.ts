import { expect, it, vi } from "vitest"

import { getDailyMeals } from "@/features/dashboard/api/dashboard-api"
import { getMeals } from "@/features/meals/api/meals-api"

vi.mock("@/features/meals/api/meals-api", () => ({ getMeals: vi.fn() }))

it("includes meals beyond the API's first page in the daily summary", async () => {
  const makeMeal = (id: number) => ({ id, mealType: "BREAKFAST" as const, mealDate: "2026-09-12" })
  vi.mocked(getMeals)
    .mockResolvedValueOnce({
      content: Array.from({ length: 100 }, (_, id) => makeMeal(id + 1)),
      page: 0,
      size: 100,
      totalElements: 101,
      totalPages: 2,
    })
    .mockResolvedValueOnce({
      content: [makeMeal(101)],
      page: 1,
      size: 100,
      totalElements: 101,
      totalPages: 2,
    })
  const signal = new AbortController().signal
  const meals = await getDailyMeals("2026-09-12", signal)
  expect(meals).toHaveLength(101)
  expect(meals.at(-1)?.id).toBe(101)
  expect(getMeals).toHaveBeenLastCalledWith({ page: 1, size: 100, mealDate: "2026-09-12" }, signal)
})
