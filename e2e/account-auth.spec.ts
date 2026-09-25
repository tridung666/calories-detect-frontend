import { expect, test } from "@playwright/test"

import { login, mockApi, TEST_PASSWORD } from "./fixtures"

test("unverified login opens verification without sending a code automatically", async ({
  page,
}) => {
  const state = await mockApi(page)
  state.unverified = true
  await page.goto("/auth/login")
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/verify-email$/)
  expect(state.requests.some((r) => r.path === "/auth/resend-otp")).toBe(false)
  await page.getByLabel("Mã xác minh", { exact: true }).fill("123456")
  await page.getByRole("button", { name: "Gửi lại mã", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveValue("123456")
  await expect(page.getByText(/Nếu email cần xác minh và giới hạn cho phép/)).toBeVisible()
  await page.getByRole("button", { name: "Xác thực email", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("test@example.com")
})

test("Google-only users can add a password without OTP, then sign in locally", async ({
  page,
}, testInfo) => {
  const state = await mockApi(page)
  state.googleOnly = true
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/auth/login")
  await page.getByRole("button", { name: "Test Google sign-in" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto("/profile")
  await page.getByLabel("Mật khẩu đăng nhập mới", { exact: true }).fill("NewPassword123!")
  await page.getByLabel("Xác nhận mật khẩu đăng nhập", { exact: true }).fill("Mismatch123!")
  await page.getByRole("button", { name: "Đặt mật khẩu", exact: true }).click()
  await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible()
  expect(state.requests.some((r) => r.path === "/auth/set-password")).toBe(false)
  await page.getByLabel("Xác nhận mật khẩu đăng nhập", { exact: true }).fill("NewPassword123!")
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath("account-auth-mobile.png"), fullPage: true })
  await page.getByRole("button", { name: "Đặt mật khẩu", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  expect(await page.evaluate(() => localStorage.getItem("calories-detect:tokens"))).toBeNull()
  expect(state.requests.find((r) => r.path === "/auth/set-password")?.body).toEqual({
    newPassword: "NewPassword123!",
    confirmPassword: "NewPassword123!",
  })
  expect(state.requests.some((r) => /otp|reset-password|change-password/.test(r.path))).toBe(false)
  await page.getByLabel("Mật khẩu", { exact: true }).fill("NewPassword123!")
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("existing local password directs users to change password", async ({ page }) => {
  await mockApi(page)
  await login(page, "/profile")
  await page.getByLabel("Mật khẩu đăng nhập mới", { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel("Xác nhận mật khẩu đăng nhập", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Đặt mật khẩu", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Tài khoản đã có mật khẩu")
  await page.getByRole("link", { name: "Đổi mật khẩu", exact: true }).click()
  await expect(page).toHaveURL(/\/profile\/change-password$/)
})

test("Google linking handles conflicts and preserves the current session", async ({ page }) => {
  const state = await mockApi(page)
  await login(page, "/profile")
  const refreshes = state.requests.filter((r) => r.path === "/auth/refresh-token").length
  state.googleConflict = true
  await page.getByRole("button", { name: "Test Google sign-in" }).click()
  await expect(page.getByRole("alert")).toContainText("Hãy chọn đúng tài khoản Google")
  state.googleConflict = false
  await page.getByRole("button", { name: "Test Google sign-in" }).click()
  await expect(page.getByRole("status").filter({ hasText: "Đã liên kết Google" })).toBeVisible()
  expect(state.googleLinked).toBe(true)
  expect(state.requests.filter((r) => r.path === "/auth/refresh-token")).toHaveLength(refreshes)
  await expect(page.getByRole("button", { name: "Đăng xuất", exact: true })).toBeVisible()
  expect(state.requests.filter((r) => r.path === "/auth/google/link").map((r) => r.body)).toEqual([
    { idToken: "test-google-id-token" },
    { idToken: "test-google-id-token" },
  ])
})

test("logout clears the local session even when the server is unavailable", async ({ page }) => {
  await mockApi(page)
  await login(page)
  await page.route("**/api/auth/logout", (route) => route.abort("failed"))
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login/)
  expect(await page.evaluate(() => localStorage.getItem("calories-detect:tokens"))).toBeNull()
})

test("restoring a session waits for backend acceptance and allows retry after network failure", async ({
  page,
}) => {
  await mockApi(page)
  await login(page)
  let unavailable = true
  await page.route("**/api/user/1", async (route) => {
    if (unavailable) await route.abort("failed")
    else await route.fallback()
  })
  await page.reload()
  await expect(page.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem("calories-detect:tokens"))).toBeNull()
  unavailable = false
  await page.getByRole("button", { name: "Thử lại", exact: true }).click()
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible()
})
