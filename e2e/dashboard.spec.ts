import { expect, test, type Page } from "@playwright/test"

import { login, mockApi, TEST_DATE } from "./fixtures"

test.use({ reducedMotion: "reduce" })

const populateDay = (state: Awaited<ReturnType<typeof mockApi>>) => {
  state.meals = [
    { id: 1, mealType: "BREAKFAST", mealDate: TEST_DATE },
    { id: 2, mealType: "LUNCH", mealDate: TEST_DATE },
    { id: 3, mealType: "SNACK", mealDate: TEST_DATE },
  ]
  state.items = {
    1: [
      {
        id: 1,
        mealId: 1,
        inputName: "Sữa chua Hy Lạp, yến mạch và việt quất",
        normalizedName: null,
        quantityGrams: 250,
        calories: 320,
        proteinGrams: 20,
        carbohydrateGrams: 42,
        fatGrams: 8,
      },
    ],
    2: [
      {
        id: 2,
        mealId: 2,
        inputName: "Cơm gạo lứt, ức gà nướng và rau củ",
        normalizedName: null,
        quantityGrams: 400,
        calories: 720,
        proteinGrams: 55,
        carbohydrateGrams: 78,
        fatGrams: 21,
      },
    ],
    3: [
      {
        id: 3,
        mealId: 3,
        inputName: "Táo và hạnh nhân",
        normalizedName: null,
        quantityGrams: 200,
        calories: 270,
        proteinGrams: 10,
        carbohydrateGrams: 30,
        fatGrams: 13,
      },
    ],
  }
}

const expectNoOverflow = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
}

test("keeps date-filtered totals, meal links and creation defaults", async ({ page }) => {
  const state = await mockApi(page)
  populateDay(state)
  await login(page, `/dashboard?date=${TEST_DATE}`)

  const summary = page.getByRole("region", { name: "Dinh dưỡng trong ngày", exact: true })
  await expect(summary.getByText("1.310", { exact: true })).toBeVisible()
  await expect(summary.getByText("3 món đã ghi nhận")).toBeVisible()
  await expect(page.getByRole("meter", { name: "Bữa trưa", exact: true })).toHaveAttribute(
    "aria-valuetext",
    "720 trên tổng 1.310 kcal",
  )

  await page.getByLabel("Ngày theo dõi", { exact: true }).fill("2026-09-11")
  await expect(page).toHaveURL(/date=2026-09-11$/)
  await expect(page.getByText("Bắt đầu ghi lại ngày của bạn")).toBeVisible()
  await expect(summary.getByText("0 món đã ghi nhận")).toBeVisible()

  const addDinner = page.getByRole("button", { name: "Thêm bữa tối", exact: true })
  await addDinner.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("dialog").getByLabel("Ngày ăn")).toHaveValue("2026-09-11")
  await expect(page.getByRole("dialog").getByLabel("Bữa ăn", { exact: true })).toHaveValue("DINNER")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).not.toBeVisible()
  await expect(addDinner).toBeFocused()

  await addDinner.click()
  await page.getByRole("button", { name: "Tạo bữa ăn", exact: true }).click()
  await expect(page).toHaveURL(/\/meals\/4$/)
  expect(state.meals.at(-1)).toEqual({ id: 4, mealType: "DINNER", mealDate: "2026-09-11" })

  await page.goto(`/dashboard?date=${TEST_DATE}`)
  await page.getByRole("link").filter({ hasText: "Sữa chua Hy Lạp" }).focus()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/meals\/1$/)
})

test("announces loading, disables refresh and recovers from errors", async ({ page }) => {
  const state = await mockApi(page)
  let releaseMeals = () => {}
  const mealsReady = new Promise<void>((resolve) => {
    releaseMeals = resolve
  })
  await page.route(
    (url) => url.pathname === "/api/meal",
    async (route) => {
      await mealsReady
      await route.fallback()
    },
  )

  try {
    await login(page, `/dashboard?date=${TEST_DATE}`)
    await expect(page.getByRole("status", { name: "Đang tải dữ liệu" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Làm mới", exact: true })).toBeDisabled()
  } finally {
    releaseMeals()
  }

  await expect(page.getByText("Bắt đầu ghi lại ngày của bạn")).toBeVisible()
  state.failMeals = true
  await page.getByRole("button", { name: "Làm mới", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Chưa thể tải dữ liệu")
  state.failMeals = false
  await page.getByRole("button", { name: "Thử lại", exact: true }).click()
  await expect(page.getByText("Bắt đầu ghi lại ngày của bạn")).toBeVisible()
})

for (const width of [320, 768, 1440]) {
  test(`dashboard works at ${width}px with both languages, dark mode and long content`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    const state = await mockApi(page)
    populateDay(state)
    await login(page, `/dashboard?date=${TEST_DATE}`)
    await expect(page.getByText("3 món đã ghi nhận")).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath("dashboard-vi.png"), fullPage: true })

    await page.getByRole("button", { name: "Đổi ngôn ngữ", exact: true }).click()
    await page.getByRole("menuitemradio", { name: "English", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Nutrition overview" })).toBeVisible()
    await expect(page.getByText("3 foods recorded")).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: testInfo.outputPath("dashboard-en.png"), fullPage: true })

    await page.getByRole("button", { name: "Change color theme", exact: true }).click()
    await page.getByRole("menuitem", { name: "Dark", exact: true }).click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await expect(page.getByRole("menu")).not.toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("dashboard-dark.png"), fullPage: true })

    state.items[1][0].inputName = "An unusually long food name ".repeat(15)
    state.items[2] = []
    await page.getByRole("button", { name: "Refresh", exact: true }).click()
    await expect(page.getByText("Add foods to this meal", { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.getByRole("button", { name: "Log a meal", exact: true }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expectNoOverflow(page)
    await page.keyboard.press("Escape")
    expect(errors).toEqual([])
  })
}
