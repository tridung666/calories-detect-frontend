import { expect, test } from "@playwright/test"

import { login, mockApi, TEST_PASSWORD } from "./fixtures"

test("guards private routes, validates login and preserves the requested route", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/meals?page=2")
  await expect(page).toHaveURL(/\/auth\/login\?next=/)
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
  await expect(page.getByText("Vui lòng nhập email")).toBeVisible()
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong")
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
  await expect(
    page.getByRole("alert").getByText("Email hoặc mật khẩu chưa chính xác."),
  ).toBeVisible()
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
  await expect(page).toHaveURL(/\/meals\?page=2$/)
  // Local sign-out redirects immediately; wait for cookie revocation before
  // starting a new document, which would otherwise cancel the pending request.
  const logoutResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/logout") && response.request().method() === "POST",
  )
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click()
  expect((await logoutResponse).status()).toBe(200)
  await expect(page).toHaveURL(/\/auth\/login/)
  await page.goto("/profile")
  await expect(page).toHaveURL(/\/auth\/login/)
})

test("registers an account after password confirmation validation", async ({ page }) => {
  const state = await mockApi(page)
  state.otp = "012345"
  await page.goto("/auth/register")
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh")
  await page.getByLabel("Email", { exact: true }).fill("New@Example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill("Mismatch!")
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click()
  await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible()
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/verify-email$/)
  await expect(page.getByText("new@example.com", { exact: false })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull()
  await page.getByLabel("Mã xác minh", { exact: true }).fill("012345")
  await page.getByRole("button", { name: "Xác thực email", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  expect(state.requests.find((entry) => entry.path === "/auth/verify-email")?.body).toEqual({
    email: "new@example.com",
    otp: "012345",
  })
  expect(await page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull()
  await login(page)
  const request = state.requests.find((entry) => entry.path === "/auth/register")
  expect(request?.body).toEqual({
    fullName: "Nguyễn Minh Anh",
    email: "New@Example.com",
    password: TEST_PASSWORD,
  })
})

test("blocks non-admin users and allows admins to create accounts", async ({ page }) => {
  const state = await mockApi(page, "ADMIN")
  await login(page, "/admin/users")
  await page.getByRole("button", { name: "Thêm người dùng" }).click()
  await page.getByLabel("Họ và tên").fill("Thành Viên Mới")
  await page.getByLabel("Email", { exact: true }).fill("member@example.com")
  await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Tạo người dùng", exact: true }).click()
  await expect(page.getByText("member@example.com")).toBeVisible()
  expect(state.users).toHaveLength(2)
})

test("redirects non-admin users away from administration", async ({ page }) => {
  const state = await mockApi(page)
  await login(page)
  await page.goto("/admin/users")
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(state.requests.some((entry) => entry.path === "/admin/users")).toBe(false)
})

test("mobile navigation, dark mode and password update work", async ({ page }, testInfo) => {
  const state = await mockApi(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click()
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Tài khoản", exact: true })
    .click()
  await expect(page.getByRole("heading", { name: "Tài khoản", exact: true })).toBeVisible()
  await expect(page.getByRole("dialog")).not.toBeVisible()
  await page.getByRole("link", { name: "Cài đặt", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Cài đặt", exact: true })).toBeVisible()
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toBeVisible()
  await page.getByLabel("Mã xác minh", { exact: true }).fill("123456")
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("ChangedPass123!")
  await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill("ChangedPass123!")
  await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  expect(
    await page.evaluate(() => [
      localStorage.getItem("accessToken"),
      localStorage.getItem("refreshToken"),
    ]),
  ).toEqual([null, null])
  expect(
    state.requests.find((entry) => entry.path === "/auth/change-password/request")?.body,
  ).toEqual({ currentPassword: TEST_PASSWORD })
  expect(state.requests.find((entry) => entry.path === "/auth/reset-password")?.body).toEqual({
    email: "test@example.com",
    otp: "123456",
    newPassword: "ChangedPass123!",
    confirmPassword: "ChangedPass123!",
  })
  await page.getByRole("button", { name: "Đổi giao diện sáng tối" }).click()
  await page.getByRole("menuitem", { name: "Tối", exact: true }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: testInfo.outputPath("mobile-profile-dark.png"), fullPage: true })
})

test("desktop dashboard has no page errors or horizontal overflow", async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await mockApi(page)
  await login(page)
  await expect(page.getByRole("heading", { name: "Bữa ăn trong ngày" })).toBeVisible()
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: testInfo.outputPath("desktop-dashboard.png"), fullPage: true })
})
