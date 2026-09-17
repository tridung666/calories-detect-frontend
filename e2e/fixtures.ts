import { expect, type Page } from "@playwright/test"

import type { Meal, MealItem } from "../src/features/meals/types/meal"

export const TEST_DATE = "2026-09-12"
export const TEST_PASSWORD = "TestPass123!"

export const mockApi = async (page: Page, role: "USER" | "ADMIN" = "USER") => {
  const user = {
    id: 1,
    fullName: "Nguyễn Minh Anh",
    email: "test@example.com",
    role,
    status: "ACTIVE",
    createdAt: "2026-09-01T08:00:00",
    updatedAt: "2026-09-12T08:00:00",
  }
  const state = {
    meals: [] as Meal[],
    items: {} as Record<number, MealItem[]>,
    users: [user],
    failMeals: false,
    requests: [] as { method: string; path: string; body: Record<string, unknown> }[],
  }
  const tokens = () => ({
    accessToken: `test.${Buffer.from(JSON.stringify({ userId: 1, sub: user.email, role, exp: 9_999_999_999 })).toString("base64url")}.signature`,
    refreshToken: "test-refresh-token",
    tokenType: "Bearer",
    expiresIn: 3600,
  })

  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname.replace(/^\/api/, "")
      const method = request.method()
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>
      state.requests.push({ method, path, body })
      const reply = (data: unknown, status = 200, code = status) =>
        route.fulfill({
          status,
          json: { success: status < 400, code, message: status < 400 ? "Success" : "Error", data },
        })
      const paginate = <T>(entries: T[]) => {
        const pageNo = Number(url.searchParams.get("pageNo") ?? 0)
        const pageSize = Number(url.searchParams.get("pageSize") ?? 10)
        return {
          data: entries.slice(pageNo * pageSize, (pageNo + 1) * pageSize),
          pageNo,
          pageSize,
          totalElements: entries.length,
          totalPages: Math.ceil(entries.length / pageSize),
          last: (pageNo + 1) * pageSize >= entries.length,
        }
      }
      if (path === "/auth/login")
        return body.password === TEST_PASSWORD ? reply(tokens()) : reply(null, 401, 11001)
      if (path === "/auth/refresh-token") return reply(tokens())
      if (path === "/auth/register") return reply(user)
      if (path === "/auth/logout" || path === "/auth/change-password") return reply(null)
      if (path === "/user/1") return reply(user)
      if (path === "/admin/users") {
        if (role !== "ADMIN") return reply(null, 403)
        if (method === "POST") {
          const created = { ...user, ...body, id: state.users.length + 1 }
          state.users.push(created)
          return reply(created)
        }
        return reply(paginate(state.users))
      }
      if (path === "/meal" && method === "GET") {
        if (state.failMeals) return reply(null, 500)
        return reply(
          paginate(
            state.meals.filter(
              (meal) =>
                (!url.searchParams.get("mealDate") ||
                  meal.mealDate === url.searchParams.get("mealDate")) &&
                (!url.searchParams.get("mealType") ||
                  meal.mealType === url.searchParams.get("mealType")),
            ),
          ),
        )
      }
      if (path === "/meal/create") {
        const meal = {
          id: Math.max(0, ...state.meals.map((entry) => entry.id)) + 1,
          ...body,
        } as Meal
        state.meals.push(meal)
        state.items[meal.id] = []
        return reply(meal)
      }
      const match = path.match(/^\/meal\/(\d+)(?:\/items(?:\/(\d+))?)?$/)
      if (match) {
        const mealId = Number(match[1])
        const itemId = Number(match[2])
        const meal = state.meals.find((entry) => entry.id === mealId)
        if (!meal) return reply(null, 404, 14000)
        if (!path.includes("/items")) {
          if (method === "DELETE") {
            state.meals = state.meals.filter((entry) => entry.id !== mealId)
            delete state.items[mealId]
            return reply(null)
          }
          if (method === "PUT") Object.assign(meal, body)
          return reply(meal)
        }
        const items = state.items[mealId] ?? []
        if (method === "GET") return reply(items)
        if (method === "POST") {
          const item = {
            ...body,
            mealId,
            id: Math.max(0, ...items.map((entry) => entry.id)) + 1,
          } as MealItem
          state.items[mealId] = [...items, item]
          return reply(item)
        }
        if (method === "DELETE") {
          state.items[mealId] = items.filter((item) => item.id !== itemId)
          return reply(null)
        }
        const item = items.find((entry) => entry.id === itemId)
        if (!item) return reply(null, 404, 14002)
        Object.assign(item, body)
        return reply(item)
      }
      return reply(null, 404)
    },
  )
  return state
}

export const login = async (page: Page, destination = "/dashboard") => {
  await page.goto(destination)
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(destination.replace(/[?]/g, "\\?") + "$"))
}
