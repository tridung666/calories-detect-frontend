import { expect, type Page } from "@playwright/test"

import type { Meal, MealItem } from "../src/features/meals/types/meal"

export const TEST_DATE = "2026-09-12"
export const TEST_PASSWORD = "TestPass123!"

export const mockApi = async (page: Page, role: "USER" | "ADMIN" = "USER") => {
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `let googleCallback;
      window.google = { accounts: { id: {
        initialize: (options) => { googleCallback = options.callback; },
        renderButton: (element) => {
          const button = document.createElement('button');
          button.textContent = 'Test Google sign-in';
          button.onclick = () => googleCallback({ credential: 'test-google-id-token' });
          element.appendChild(button);
        }
      } } };`,
    }),
  )
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
    refreshToken: null as string | null,
    tokenVersion: 0,
    expiresIn: 3600,
    meals: [] as Meal[],
    items: {} as Record<number, MealItem[]>,
    users: [user],
    failMeals: false,
    googleOnly: false,
    googleConflict: false,
    googleLinked: false,
    unverified: false,
    otp: "123456",
    password: TEST_PASSWORD,
    requests: [] as {
      method: string
      path: string
      body: Record<string, unknown>
      authorization?: string
    }[],
  }
  const tokens = () => ({
    accessToken: `test.${Buffer.from(JSON.stringify({ userId: 1, sub: user.email, role, exp: 9_999_999_999 })).toString("base64url")}.signature-${state.tokenVersion}`,
    tokenType: "Bearer",
    expiresIn: state.expiresIn,
  })

  await page.context().route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname.replace(/^\/api/, "")
      const method = request.method()
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>
      state.requests.push({ method, path, body, authorization: request.headers().authorization })
      const reply = (
        data: unknown,
        status = 200,
        code = status,
        headers?: Record<string, string>,
      ) =>
        route.fulfill({
          status,
          headers,
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
      const issue = () => {
        state.refreshToken = `refresh-${++state.tokenVersion}`
        return reply(tokens(), 200, 200, {
          "Set-Cookie": `calories_refresh=${state.refreshToken}; HttpOnly; SameSite=Lax; Path=/api/auth`,
        })
      }
      if (path === "/auth/csrf") return reply({ token: "test-csrf", headerName: "X-XSRF-TOKEN" })
      if (
        ["/auth/login", "/auth/google", "/auth/refresh-token", "/auth/logout"].includes(path) &&
        request.headers()["x-xsrf-token"] !== "test-csrf"
      )
        return reply(null, 403)
      if (path === "/auth/login") {
        if (state.googleOnly || body.password !== state.password) return reply(null, 400, 11001)
        if (state.unverified) return reply(null, 400, 11005)
        return issue()
      }
      if (path === "/auth/google") return state.googleConflict ? reply(null, 400, 11007) : issue()
      if (path === "/auth/refresh-token") {
        const cookie = (await request.allHeaders()).cookie ?? ""
        if (!state.refreshToken || !cookie.includes(`calories_refresh=${state.refreshToken}`))
          return reply(null, 401, 13000)
        return issue()
      }
      if (path === "/auth/register")
        return reply({
          ...user,
          email: String(body.email).trim().toLowerCase(),
          emailVerified: false,
        })
      if (path === "/auth/verify-email") {
        if (body.otp !== state.otp) return reply(null, 400, 11006)
        state.unverified = false
        return reply("Email verified")
      }
      if (path === "/auth/google/link") {
        if (state.googleConflict) return reply(null, 400, 11007)
        state.googleLinked = true
        return reply("Google linked")
      }
      if (path === "/auth/set-password") {
        if (!state.googleOnly) return reply(null, 400, 11013)
        state.googleOnly = false
        state.password = String(body.newPassword)
        state.refreshToken = null
        return reply("Password set")
      }
      if (path === "/auth/resend-otp") return reply("Code sent")
      if (path === "/auth/forgot-password") return reply("If eligible, a code will be sent")
      if (path === "/auth/change-password/request") {
        if (state.googleOnly) return reply(null, 400, 11009)
        return body.currentPassword === state.password
          ? reply("Code sent")
          : reply(null, 400, 11002)
      }
      if (path === "/auth/reset-password") {
        if (body.otp !== state.otp) return reply(null, 400, 11006)
        state.password = String(body.newPassword)
        if (body.email === user.email) state.refreshToken = null
        return reply("Password changed")
      }
      if (path === "/auth/logout") {
        state.refreshToken = null
        return reply(null, 200, 200, {
          "Set-Cookie": "calories_refresh=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/api/auth",
        })
      }
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
