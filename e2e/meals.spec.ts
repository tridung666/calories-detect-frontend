import { expect, test } from "@playwright/test"

import { login, mockApi, TEST_DATE } from "./fixtures"

test("creates, updates and deletes a meal and its items; dashboard uses portion totals", async ({
  page,
}) => {
  const state = await mockApi(page)
  await login(page, "/meals")
  await expect(page.getByText("Bắt đầu với bữa ăn đầu tiên")).toBeVisible()
  await page.getByRole("button", { name: "Thêm bữa ăn", exact: true }).first().click()
  await page.getByLabel("Ngày ăn", { exact: true }).last().fill(TEST_DATE)
  await page.getByLabel("Bữa ăn", { exact: true }).selectOption("LUNCH")
  await page.getByRole("button", { name: "Tạo bữa ăn", exact: true }).click()
  await expect(page).toHaveURL(/\/meals\/1$/)
  await page.getByRole("button", { name: "Thêm món ăn", exact: true }).click()
  await page.getByLabel("Tên món ăn", { exact: true }).fill("Cơm gà")
  await page.getByLabel("Khối lượng khẩu phần (g)").fill("250")
  await page.getByLabel("Năng lượng (kcal)").fill("450")
  await page.getByLabel("Chất đạm (g)").fill("30")
  await page.getByLabel("Tinh bột (g)").fill("50")
  await page.getByLabel("Chất béo (g)").fill("12")
  await page.getByRole("dialog").getByRole("button", { name: "Thêm món ăn", exact: true }).click()
  await expect(page.getByRole("cell", { name: "Cơm gà", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Sửa Cơm gà" }).click()
  await page.getByLabel("Năng lượng (kcal)").fill("500")
  await page.getByRole("button", { name: "Lưu thay đổi" }).click()
  await expect(page.getByRole("cell", { name: "500", exact: true })).toBeVisible()
  await page.goto(`/dashboard?date=${TEST_DATE}`)
  await expect(page.getByText("500 kcal").first()).toBeVisible()
  await expect(page.getByText("Cơm gà", { exact: true })).toBeVisible()
  await page.getByRole("link").filter({ hasText: "Cơm gà" }).click()
  await page.getByRole("button", { name: "Xóa Cơm gà" }).click()
  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  expect(state.items[1]).toHaveLength(1)
  await page.getByRole("button", { name: "Xóa Cơm gà" }).click()
  await page.getByRole("button", { name: "Xác nhận xóa" }).click()
  await expect(page.getByText("Bữa ăn chưa có món nào")).toBeVisible()
  await page.getByRole("button", { name: "Sửa bữa ăn" }).click()
  await page.getByLabel("Bữa ăn", { exact: true }).selectOption("DINNER")
  await page.getByRole("button", { name: "Lưu thay đổi" }).click()
  await expect(page.getByRole("heading", { name: "Bữa tối", exact: true })).toBeVisible()
  await page.goto("/meals")
  await page.getByRole("button", { name: /Xóa bữa tối/ }).click()
  await page.getByRole("button", { name: "Xác nhận xóa" }).click()
  await expect(page.getByText("Bắt đầu với bữa ăn đầu tiên")).toBeVisible()
  expect(state.meals).toHaveLength(0)
})

test("uses real pagination parameters, resets page on filtering and recovers from API errors", async ({
  page,
}) => {
  const state = await mockApi(page)
  state.meals = Array.from({ length: 11 }, (_, index) => ({
    id: index + 1,
    mealType: "BREAKFAST",
    mealDate: TEST_DATE,
  }))
  await login(page, "/meals")
  await page.getByRole("button", { name: "Trang sau" }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText("11–11 trong 11 kết quả")).toBeVisible()
  expect(state.requests.some((entry) => entry.path === "/meal")).toBe(true)
  await page.getByLabel("Loại bữa ăn").selectOption("DINNER")
  await expect(page.getByText("Chưa có bữa ăn phù hợp")).toBeVisible()
  await expect(page).not.toHaveURL(/page=2/)
  state.failMeals = true
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click()
  // Clearing filters can reuse fresh cached data. Reload to exercise an API failure.
  await page.reload()
  await expect(page.getByText("Chưa thể tải dữ liệu")).toBeVisible()
  state.failMeals = false
  await page.getByRole("button", { name: "Thử lại" }).click()
  await expect(page.getByRole("table")).toBeVisible()
})

test("validates portions and nutrition before sending a request", async ({ page }) => {
  const state = await mockApi(page)
  state.meals = [{ id: 1, mealType: "BREAKFAST", mealDate: TEST_DATE }]
  await login(page, "/meals/1")
  await page.getByRole("button", { name: "Thêm món ăn", exact: true }).click()
  await page.getByLabel("Tên món ăn", { exact: true }).fill("Táo")
  await page.getByLabel("Khối lượng khẩu phần (g)").fill("0")
  await page.getByLabel("Năng lượng (kcal)").fill("-1")
  await page.getByRole("dialog").getByRole("button", { name: "Thêm món ăn", exact: true }).click()
  await expect(page.getByText("Khối lượng phải lớn hơn 0")).toBeVisible()
  await expect(page.getByText("Giá trị không được âm")).toBeVisible()
  expect(
    state.requests.some((entry) => entry.method === "POST" && entry.path.endsWith("/items")),
  ).toBe(false)
})
