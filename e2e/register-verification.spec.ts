import { expect, test } from "@playwright/test"

import { mockApi, TEST_PASSWORD } from "./fixtures"

test("registration verification handles reload, invalid codes and resending on mobile", async ({
  page,
}, testInfo) => {
  const state = await mockApi(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install()
  await page.goto("/auth/register")
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh")
  await page.getByLabel("Email", { exact: true }).fill("new@example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/verify-email$/)
  await page.reload()
  await expect(page.getByText("new@example.com", { exact: false })).toBeVisible()
  await expect(page.getByRole("button", { name: /Yêu cầu lại sau/ })).toBeDisabled()
  const otp = page.getByLabel("Mã xác minh", { exact: true })
  const submit = page.getByRole("button", { name: "Xác thực email", exact: true })
  await otp.fill("123")
  await submit.click()
  await expect(otp).toHaveAttribute("aria-invalid", "true")
  expect(state.requests.filter((entry) => entry.path === "/auth/verify-email")).toHaveLength(0)
  await otp.fill("000000")
  await submit.click()
  await expect(otp).toHaveAttribute("aria-invalid", "true")
  await expect(page).toHaveURL(/\/auth\/verify-email$/)
  await page.clock.fastForward(61_000)
  await page.getByRole("button", { name: "Gửi lại mã", exact: true }).click()
  await expect(otp).toHaveValue("000000")
  await expect(page.getByRole("button", { name: /Yêu cầu lại sau/ })).toBeDisabled()
  expect(state.requests.find((entry) => entry.path === "/auth/resend-otp")?.body).toEqual({
    email: "new@example.com",
  })
  expect(state.requests.some((entry) => entry.path === "/auth/forgot-password")).toBe(false)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath("verify-email-mobile.png"), fullPage: true })
  await otp.fill("123456")
  await submit.click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  expect(await page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull()
})

test("verification without a registered email returns to registration", async ({ page }) => {
  const state = await mockApi(page)
  await page.goto("/auth/verify-email")
  await expect(page).toHaveURL(/\/auth\/register$/)
  expect(state.requests.some((entry) => entry.path === "/auth/verify-email")).toBe(false)
})

test("failed registration stays on the form", async ({ page }) => {
  await mockApi(page)
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 409, json: { code: 10001, message: "Email already exists" } }),
  )
  await page.goto("/auth/register")
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh")
  await page.getByLabel("Email", { exact: true }).fill("new@example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/register$/)
})
