import { getMeals } from "@/features/meals/api/meals-api"

// The API has no aggregate endpoint. Fetch every page so a busy day is never truncated.
export const getDailyMeals = async (mealDate: string, signal?: AbortSignal) => {
  const first = await getMeals({ page: 0, size: 100, mealDate }, signal)
  const meals = [...first.content]
  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await getMeals({ page, size: 100, mealDate }, signal)
    meals.push(...next.content)
  }
  return meals
}
