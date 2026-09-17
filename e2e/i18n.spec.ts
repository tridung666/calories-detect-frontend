import { expect, test, type Page } from "@playwright/test"

import { login, mockApi, TEST_DATE, TEST_PASSWORD } from "./fixtures"

const changeLanguage = async (page: Page, language: "English" | "Tiếng Việt") => {
  await page.getByRole("button", { name: /^(Đổi ngôn ngữ|Change language)$/ }).click()
  await page.getByRole("menuitemradio", { name: language, exact: true }).click()
}

test("switches existing form errors, preserves input and persists across reloads", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/auth/register")
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh")
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click()
  await expect(page.getByText("Vui lòng nhập email")).toBeVisible()
  await changeLanguage(page, "English")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page).toHaveTitle("Create account · Calories Detect")
  await expect(page.getByText("Please enter your email")).toBeVisible()
  await expect(page.getByLabel("Full name")).toHaveValue("Nguyễn Minh Anh")
  await expect(page.getByRole("button", { name: "Show password", exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  await page.getByLabel("Email", { exact: true }).fill("test@example.com")
  await page.getByLabel("Password", { exact: true }).fill("wrong")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible()
  await changeLanguage(page, "Tiếng Việt")
  await expect(page.getByText("Email hoặc mật khẩu chưa chính xác.")).toBeVisible()
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveValue("wrong")
})

test("localizes meals, dates, numbers, dialogs, notifications and account pages", async ({
  page,
}) => {
  const state = await mockApi(page, "ADMIN")
  state.meals = [{ id: 1, mealType: "LUNCH", mealDate: TEST_DATE }]
  state.items[1] = [
    {
      id: 1,
      mealId: 1,
      inputName: "Cơm gà",
      normalizedName: null,
      quantityGrams: 1234.5,
      calories: 450,
      proteinGrams: 30,
      carbohydrateGrams: 50,
      fatGrams: 12,
    },
  ]
  await login(page, "/meals")
  await changeLanguage(page, "English")
  await expect(page.getByRole("heading", { name: "Meal diary", exact: true })).toBeVisible()
  await expect(page.getByText("1 meal", { exact: true })).toBeVisible()
  await expect(page.getByText("1–1 of 1 result")).toBeVisible()
  await expect(page.getByRole("cell", { name: "09/12/2026", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Lunch", exact: true }).click()
  await expect(page.getByRole("cell", { name: "1,234.5 g", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Edit Cơm gà", exact: true }).click()
  await expect(page.getByRole("dialog")).toContainText("Edit food")
  await page.getByLabel("Calories (kcal)").fill("500")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByText("Food updated", { exact: true })).toBeVisible()
  await changeLanguage(page, "Tiếng Việt")
  await expect(page.getByRole("cell", { name: "1.234,5 g", exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Bữa trưa", exact: true })).toBeVisible()
  await changeLanguage(page, "English")
  await page.goto(`/dashboard?date=${TEST_DATE}`)
  await expect(page.getByText("09/12/2026 · 1 meal recorded", { exact: true })).toBeVisible()
  await page.goto("/profile")
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible()
  await expect(page.getByLabel("Current password", { exact: true })).toBeVisible()
  await page.goto("/admin/users")
  await expect(page.getByRole("heading", { name: "User management", exact: true })).toBeVisible()
  await expect(page.getByText("1 account", { exact: true })).toBeVisible()
  expect(state.requests.find((request) => request.method === "PUT")?.body).toMatchObject({
    inputName: "Cơm gà",
    quantityGrams: 1234.5,
    calories: 500,
  })
})

test("keeps the language picker and mobile navigation usable in both languages", async ({
  page,
}, testInfo) => {
  await mockApi(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await changeLanguage(page, "English")
  await page.getByRole("button", { name: "Open navigation menu" }).click()
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Account", exact: true })
    .click()
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: testInfo.outputPath("mobile-profile-en.png"), fullPage: true })
  await changeLanguage(page, "Tiếng Việt")
  await expect(page.getByRole("heading", { name: "Tài khoản", exact: true })).toBeVisible()
  await page.goto("/missing-page")
  await expect(page).toHaveTitle("Không tìm thấy trang · Calories Detect")
  await changeLanguage(page, "English")
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
})

test.describe("browser language preference", () => {
  test.use({ locale: "en-GB" })

  test("starts in English and keeps a manual Vietnamese choice", async ({ page }) => {
    await mockApi(page)
    await page.goto("/auth/login")
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible()
    await changeLanguage(page, "Tiếng Việt")
    await page.reload()
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible()
    await page.getByLabel("Email", { exact: true }).fill("test@example.com")
    await page.getByLabel("Mật khẩu", { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Bữa ăn trong ngày" })).toBeVisible()
  })
})
