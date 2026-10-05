import { expect, test, type Page } from "@playwright/test"

import { login, mockApi, TEST_PASSWORD } from "./fixtures"

const requestCode = async (page: Page, email = "test@example.com") => {
  await page.goto("/auth/login")
  await page.getByRole("link", { name: "Quên mật khẩu?" }).click()
  await expect(page).toHaveURL(/\/auth\/forgot-password$/)
  await page.getByLabel("Email", { exact: true }).fill(email)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toBeVisible()
}
const fillReset = async (page: Page, password = TEST_PASSWORD, otp = "012345") => {
  await page.getByLabel("Mã xác minh", { exact: true }).fill(otp)
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(password)
  await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill(password)
}
const submitReset = (page: Page) =>
  page.getByRole("button", { name: "Cập nhật mật khẩu", exact: true }).click()

test("forgot password preserves zeroes, supports paste and keyboard, and accepts the old password", async ({
  page,
}, testInfo) => {
  const state = await mockApi(page)
  state.otp = "012345"
  await page.setViewportSize({ width: 390, height: 844 })
  await requestCode(page)
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Nếu tài khoản đủ điều kiện, mã OTP sẽ được gửi đến email của bạn." }),
  ).toBeVisible()
  await fillReset(page)
  const otp = page.getByLabel("Mã xác minh", { exact: true })
  await otp.fill("")
  await otp.evaluate((element) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData("text/plain", "012345")
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData }))
  })
  await expect(otp).toHaveValue("012345")
  await otp.press("End")
  await otp.press("Backspace")
  await expect(otp).toHaveValue("01234")
  await otp.press("5")
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath("forgot-password-mobile.png"), fullPage: true })
  await submitReset(page)
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(page.getByRole("status").filter({ hasText: "Đã đổi mật khẩu" })).toBeVisible()
  expect(state.requests.find((r) => r.path === "/auth/reset-password")?.body).toEqual({
    email: "test@example.com",
    otp: "012345",
    newPassword: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
  })
  expect(state.requests.some((r) => r.path === "/auth/logout")).toBe(false)
})

test("editing email clears secrets; resending preserves OTP and shares cooldown between flows", async ({
  page,
}) => {
  const state = await mockApi(page)
  await page.clock.install()
  await requestCode(page)
  await fillReset(page)
  await page.getByRole("button", { name: "Sửa email", exact: true }).click()
  await page.getByLabel("Email", { exact: true }).fill("other@example.com")
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveValue("")
  await expect(page.getByLabel("Mật khẩu mới", { exact: true })).toHaveValue("")
  await fillReset(page)
  await expect(page.getByRole("button", { name: /Yêu cầu lại sau/ })).toBeDisabled()
  await page.clock.fastForward(61_000)
  await page.getByRole("button", { name: "Gửi lại mã", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveValue("012345")
  expect(state.requests.filter((r) => r.path === "/auth/forgot-password")).toHaveLength(3)
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(stored).not.toContain(TEST_PASSWORD)
  expect(stored).not.toContain("012345")
  await login(page, "/settings")
  // The first request to test@example.com is now more than 60 seconds old.
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await page.goto("/auth/forgot-password")
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await expect(page.getByRole("button", { name: /Yêu cầu lại sau/ })).toBeDisabled()
})

test("validation blocks invalid email, OTP, whitespace, byte overflow and confirmation mismatch", async ({
  page,
}) => {
  const state = await mockApi(page)
  await page.goto("/auth/forgot-password")
  await page.getByLabel("Email", { exact: true }).fill("invalid")
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByText("Email không đúng định dạng")).toBeVisible()
  expect(state.requests.filter((r) => r.path === "/auth/forgot-password")).toHaveLength(0)
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  for (const password of ["        ", "ế".repeat(25)]) {
    await fillReset(page, password, "123")
    await submitReset(page)
    await expect(page.getByLabel("Mật khẩu mới", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    )
  }
  await fillReset(page)
  await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill("Mismatch123!")
  await submitReset(page)
  await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible()
  expect(state.requests.filter((r) => r.path === "/auth/reset-password")).toHaveLength(0)
})

for (const [code, field] of [
  [11003, "Xác nhận mật khẩu mới"],
  [11006, "Mã xác minh"],
  [11012, "Mật khẩu mới"],
] as const) {
  test(`reset error ${code} appears at its field without exposing backend account details`, async ({
    page,
  }) => {
    await mockApi(page)
    await page.route("**/api/auth/reset-password", (route) =>
      route.fulfill({
        status: 400,
        json: { success: false, code, message: "Email does not exist" },
      }),
    )
    await requestCode(page)
    await fillReset(page)
    await submitReset(page)
    await expect(page.getByLabel(field, { exact: true })).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByText("Email does not exist")).toHaveCount(0)
  })
}

test("network and bad-request errors allow retry; rate limits honor Retry-After", async ({
  page,
}) => {
  await mockApi(page)
  await page.clock.install()
  await requestCode(page, "unknown@example.com")
  await page.route("**/api/auth/reset-password", (route) => route.abort("failed"))
  await fillReset(page)
  await submitReset(page)
  await expect(page.getByRole("alert")).toBeVisible()
  await page.route("**/api/auth/reset-password", (route) =>
    route.fulfill({ status: 400, json: { success: false, code: 400, message: "Invalid request" } }),
  )
  await submitReset(page)
  await expect(page.getByRole("alert")).toHaveText("Invalid request")
  await page.clock.fastForward(61_000)
  await page.route("**/api/auth/forgot-password", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "120" },
      json: { success: false, code: 11010, message: "Sensitive account details" },
    }),
  )
  await page.getByRole("button", { name: "Gửi lại mã", exact: true }).click()
  await expect(page.getByRole("button", { name: "Yêu cầu lại sau 120 giây" })).toBeDisabled()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveValue("012345")
  await expect(page.getByText("Sensitive account details")).toHaveCount(0)
})

test("change password validates current password, resends without retaining it, and clears local session", async ({
  page,
}) => {
  const state = await mockApi(page)
  await page.clock.install()
  await login(page, "/settings")
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("wrong")
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByLabel("Mật khẩu hiện tại", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0)
  await fillReset(page, " NewPassword123! ", "000000")
  await submitReset(page)
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await page.clock.fastForward(61_000)
  await page.getByRole("button", { name: "Gửi lại mã", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toHaveValue("000000")
  const requests = state.requests.filter((r) => r.path === "/auth/change-password/request")
  expect(requests.map((r) => r.body)).toEqual([
    { currentPassword: "wrong" },
    { currentPassword: TEST_PASSWORD },
  ])
  expect(state.requests.find((r) => r.path === "/auth/forgot-password")?.body).toEqual({
    email: "test@example.com",
  })
  await page.getByLabel("Mã xác minh", { exact: true }).fill(state.otp)
  await submitReset(page)
  await expect(page).toHaveURL(/\/auth\/login$/)
  expect(
    await page.evaluate(() => [
      localStorage.getItem("accessToken"),
      localStorage.getItem("refreshToken"),
    ]),
  ).toEqual([null, null])
  expect(state.requests.some((r) => r.path === "/auth/logout")).toBe(false)
  expect(state.password).toBe(" NewPassword123! ")
  await page.goto("/settings")
  await expect(page).toHaveURL(/\/auth\/login/)
})

for (const sameAccount of [true, false]) {
  test(`forgot password ${sameAccount ? "clears matching" : "preserves other"} session`, async ({
    page,
  }) => {
    const state = await mockApi(page)
    state.otp = "012345"
    await login(page)
    await page.goto("/auth/forgot-password")
    await page
      .getByLabel("Email", { exact: true })
      .fill(sameAccount ? "test@example.com" : "other@example.com")
    await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
    await fillReset(page)
    await submitReset(page)
    await expect(page).toHaveURL(/\/auth\/login$/)
    await page.goto("/dashboard")
    await expect(page).toHaveURL(sameAccount ? /\/auth\/login/ : /\/dashboard$/)
    expect(state.requests.some((r) => r.path === "/auth/logout")).toBe(false)
  })
}

test("missing profile email is reloaded before sending; leaving discards current password", async ({
  page,
}) => {
  const state = await mockApi(page)
  let loads = 0
  await page.route("**/api/user/1", (route) =>
    route.fulfill({
      json: {
        success: true,
        code: 200,
        data: { ...state.users[0], email: ++loads === 1 ? "" : "test@example.com" },
      },
    }),
  )
  await login(page, "/settings")
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByLabel("Mã xác minh", { exact: true })).toBeVisible()
  expect(loads).toBeGreaterThanOrEqual(2)
  await page.getByRole("link", { name: "Tổng quan", exact: true }).first().click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole("link", { name: "Cài đặt", exact: true }).first().click()
  await expect(page.getByLabel("Mật khẩu hiện tại", { exact: true })).toHaveValue("")
})
test("Google-only accounts keep their session and get an actionable local-password error", async ({
  page,
}) => {
  const state = await mockApi(page)
  state.googleOnly = true
  await page.goto("/auth/login")
  await page.getByRole("button", { name: "Test Google sign-in" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto("/settings")
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "Tài khoản chưa có mật khẩu riêng" }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Gửi mã xác minh", exact: true })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Đăng xuất", exact: true })).toBeVisible()
})

test("Google conflicts never link accounts; a successful Google login establishes a cookie session", async ({
  page,
}) => {
  const state = await mockApi(page)
  state.googleConflict = true
  await page.goto("/auth/login")
  await page.getByRole("button", { name: "Test Google sign-in" }).click()
  await expect(page.getByRole("alert").filter({ hasText: "phương thức hiện tại" })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull()
  state.googleConflict = false
  await page.getByRole("button", { name: "Test Google sign-in" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(state.requests.find((request) => request.path === "/auth/google")?.body).toEqual({
    idToken: "test-google-id-token",
  })
  expect(state.requests.some((request) => request.path.includes("link"))).toBe(false)
})

for (const flow of ["forgot", "change"] as const) {
  test(`${flow} request blocks repeated submissions while pending`, async ({ page }) => {
    await mockApi(page)
    if (flow === "change") {
      await login(page, "/settings")
      await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
    } else {
      await page.goto("/auth/forgot-password")
      await page.getByLabel("Email", { exact: true }).fill("test@example.com")
    }
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let requests = 0
    await page.route(
      `**/api/auth/${flow === "change" ? "change-password/request" : "forgot-password"}`,
      async (route) => {
        requests += 1
        await gate
        await route.fulfill({ json: { success: true, code: 200, data: "Success" } })
      },
    )
    const submit = page.getByRole("button", { name: "Gửi mã xác minh", exact: true })
    await submit.click()
    const form = page
      .locator("form")
      .filter({ has: page.locator(flow === "change" ? "#current-password" : "#email") })
    await expect(form.locator('button[type="submit"]')).toBeDisabled()
    await form.evaluate((form) => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    expect(requests).toBe(1)
    release()
    await expect(page.getByLabel("Mã xác minh", { exact: true })).toBeVisible()
    expect(requests).toBe(1)
  })
}

test("missing email after profile reload prevents requesting an OTP", async ({ page }) => {
  const state = await mockApi(page)
  await page.route("**/api/user/1", (route) =>
    route.fulfill({ json: { success: true, code: 200, data: { ...state.users[0], email: "" } } }),
  )
  await login(page, "/settings")
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Chưa có email hợp lệ trong hồ sơ")
  expect(state.requests.filter((r) => r.path === "/auth/change-password/request")).toHaveLength(0)
})

test("a successful reset still clears the session after leaving a pending form", async ({
  page,
}) => {
  await mockApi(page)
  await login(page)
  await page.goto("/auth/forgot-password")
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click()
  await fillReset(page)
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route("**/api/auth/reset-password", async (route) => {
    await gate
    await route.fulfill({ json: { success: true, code: 200, data: "Password reset successfully" } })
  })
  await submitReset(page)
  await expect(page.locator('form button[type="submit"]')).toBeDisabled()
  await page.getByRole("link", { name: "Quay lại đăng nhập" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  release()
  await expect(page).toHaveURL(/\/auth\/login/)
})
