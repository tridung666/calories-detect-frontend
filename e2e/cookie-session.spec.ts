import { expect, test } from "@playwright/test"
import { login, mockApi } from "./fixtures"

const tokenKeys = ["accessToken", "refreshToken", "calories-detect:tokens"]

test("login removes legacy secrets and reload restores from an HttpOnly cookie", async ({
  page,
  context,
}) => {
  const state = await mockApi(page)
  await page.addInitScript(() => {
    for (const key of ["accessToken", "refreshToken", "calories-detect:tokens"]) {
      localStorage.setItem(key, "legacy-secret")
      sessionStorage.setItem(key, "legacy-secret")
    }
  })
  await login(page)
  expect(
    await page.evaluate(
      (keys) => keys.flatMap((key) => [localStorage.getItem(key), sessionStorage.getItem(key)]),
      tokenKeys,
    ),
  ).toEqual(Array(6).fill(null))
  const cookie = (await context.cookies()).find((c) => c.name === "calories_refresh")
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/api/auth" })
  expect(await page.evaluate(() => document.cookie)).not.toContain("calories_refresh")
  const before = state.requests.filter((r) => r.path === "/auth/refresh-token").length
  await page.reload()
  await expect(page.getByRole("button", { name: "Đăng xuất", exact: true })).toBeVisible()
  expect(state.requests.filter((r) => r.path === "/auth/refresh-token")).toHaveLength(before + 1)
  expect(
    state.requests
      .filter((r) => r.path === "/auth/refresh-token")
      .every((r) => !r.authorization && Object.keys(r.body).length === 0),
  ).toBe(true)
})

test("logout clears cookies and synchronizes the other tab", async ({ page, context }) => {
  const state = await mockApi(page)
  await login(page)
  const other = await context.newPage()
  await other.goto("/profile")
  await expect(other.getByRole("button", { name: "Đăng xuất", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login/)
  await expect(other).toHaveURL(/\/auth\/login/)
  await expect.poll(() => state.refreshToken).toBeNull()
  expect((await context.cookies()).some((c) => c.name === "calories_refresh")).toBe(false)
  await other.reload()
  await expect(other.getByLabel("Mật khẩu", { exact: true })).toBeVisible()
  expect(state.requests.find((r) => r.path === "/auth/logout")).toMatchObject({
    body: {},
    authorization: undefined,
  })
})

test("background expiry refreshes the memory token without navigating away", async ({ page }) => {
  const state = await mockApi(page)
  state.expiresIn = 90
  await page.clock.install()
  await login(page)
  const before = state.requests.filter((r) => r.path === "/auth/refresh-token").length
  await page.clock.fastForward(61_000)
  await expect
    .poll(() => state.requests.filter((r) => r.path === "/auth/refresh-token").length)
    .toBe(before + 1)
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("refresh outage on reload offers retry without pretending the session expired", async ({
  page,
}) => {
  await mockApi(page)
  await login(page)
  let fail = true
  await page.route("**/api/auth/refresh-token", async (route) => {
    if (fail) await route.abort("failed")
    else await route.fallback()
  })
  await page.reload()
  await expect(page.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible()
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveCount(0)
  fail = false
  await page.getByRole("button", { name: "Thử lại", exact: true }).click()
  await expect(page.getByRole("button", { name: "Đăng xuất", exact: true })).toBeVisible()
})
