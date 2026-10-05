import { expect, test, type Page } from "@playwright/test"

import { login, mockApi, TEST_DATE } from "./fixtures"

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
)
const image = { name: "meal.png", mimeType: "image/png", buffer: png }
const setup = async (page: Page, withImage = true) => {
  const state = await mockApi(page)
  state.meals = [
    {
      id: 1,
      mealType: "LUNCH",
      mealDate: TEST_DATE,
      imageUrl: withImage ? "https://images.example.test/meal.png" : null,
    },
  ]
  state.items[1] = [
    {
      id: 8,
      mealId: 1,
      inputName: "Món đã lưu",
      quantityGrams: 100,
      calories: 100,
      proteinGrams: 5,
      carbohydrateGrams: 10,
      fatGrams: 2,
    },
  ]
  await page.route("https://images.example.test/*", (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  )
  return state
}
const analyze = async (page: Page) => {
  await page.getByRole("button", { name: "Phân tích ảnh", exact: true }).click()
  await expect(page.getByRole("dialog")).toContainText("Kiểm tra kết quả phân tích")
}

test("uploads, analyzes, edits decimal portions, replaces old foods and refreshes dashboard", async ({
  page,
}, testInfo) => {
  const state = await setup(page, false)
  state.analysisItems.push({
    name: "Cơm trắng",
    estimatedGrams: 100,
    calories: 130,
    protein: 2.7,
    carbohydrate: 28,
    fat: 0.3,
    confidence: 0.85,
  })
  await login(page, "/meals/1")
  await expect(page.getByRole("button", { name: "Phân tích ảnh", exact: true })).toBeDisabled()
  await page
    .getByLabel("Chọn ảnh bữa ăn", { exact: true })
    .and(page.locator("input"))
    .setInputFiles(image)
  await expect(page.getByRole("button", { name: "Phân tích ảnh", exact: true })).toBeDisabled()
  await page.getByRole("button", { name: "Tải ảnh lên", exact: true }).click()
  await analyze(page)
  const first = page.getByRole("region", { name: "Món 1", exact: true })
  await first.getByLabel("Tên món ăn", { exact: true }).fill("Ức gà nướng")
  await first.getByLabel("Khối lượng khẩu phần (g)").fill("180")
  await first.getByRole("button", { name: "Tính dinh dưỡng theo khối lượng" }).click()
  await expect(first.getByLabel("Năng lượng (kcal)")).toHaveValue("297.6")
  await expect(first.getByLabel("Chất đạm (g)")).toHaveValue("55.8")
  await expect(first.getByLabel("Chất béo (g)")).toHaveValue("6.48")
  await page.getByRole("button", { name: "Bỏ món 2 khỏi kết quả" }).click()
  await page.getByRole("button", { name: "Thêm món vào kết quả" }).click()
  const second = page.getByRole("region", { name: "Món 2", exact: true })
  await expect(second).toContainText("Món bạn tự thêm")
  await second.getByLabel("Tên món ăn", { exact: true }).fill("Rau luộc")
  await second.getByLabel("Khối lượng khẩu phần (g)").fill("80")
  await second.getByLabel("Năng lượng (kcal)").fill("28.5")
  await second.getByLabel("Chất đạm (g)").fill("2.1")
  await second.getByLabel("Tinh bột (g)").fill("4.6")
  await second.getByLabel("Chất béo (g)").fill("0.2")
  await expect(page.getByRole("dialog")).toContainText("thay thế 1 món hiện có")
  expect(state.items[1][0].inputName).toBe("Món đã lưu")
  await expect(page.getByText("Đã cập nhật ảnh bữa ăn.", { exact: true })).not.toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole("dialog").locator("dl").scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath("review-desktop.png"), animations: "disabled" })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(async () => (await page.getByRole("dialog").boundingBox())?.width)
    .toBeLessThanOrEqual(358)
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true)
  await page.screenshot({ path: testInfo.outputPath("review-mobile.png"), animations: "disabled" })
  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(first.getByLabel("Tên món ăn", { exact: true })).toHaveCSS(
    "color",
    "rgb(245, 245, 245)",
  )
  await page.setViewportSize({ width: 320, height: 740 })
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath("review-mobile-dark.png"),
    animations: "disabled",
  })
  await page.getByRole("button", { name: "Thay thế món cũ và lưu" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByRole("cell", { name: "Ức gà nướng", exact: true })).toBeVisible()
  expect(state.items[1].map((item) => item.inputName)).toEqual(["Ức gà nướng", "Rau luộc"])
  const analysisRequest = state.requests.find((entry) => entry.path.endsWith("/analyze"))!
  expect(analysisRequest.body).toEqual({})
  expect(analysisRequest.authorization).toMatch(/^Bearer /)
  const payload = state.requests.find((entry) => entry.path.endsWith("/confirm-analysis"))!.body
  expect(payload).toEqual({
    items: [
      {
        name: "Ức gà nướng",
        quantityGrams: 180,
        calories: 297.6,
        protein: 55.8,
        carbohydrate: 0,
        fat: 6.48,
      },
      {
        name: "Rau luộc",
        quantityGrams: 80,
        calories: 28.5,
        protein: 2.1,
        carbohydrate: 4.6,
        fat: 0.2,
      },
    ],
  })
  await page.goto(`/dashboard?date=${TEST_DATE}`)
  await expect(page.getByText("326,1 kcal").first()).toBeVisible()
  await page.goto("/meals/1")
  await expect(page.getByRole("cell", { name: "Rau luộc", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Xem lại kết quả" })).toHaveCount(0)
})

test("keeps an edited review after closing and after a failed confirmation, then prevents duplicate saves", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page, "/meals/1")
  await analyze(page)
  await page.getByLabel("Tên món ăn", { exact: true }).fill("Gà đã chỉnh")
  await page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }).click()
  await page.getByRole("button", { name: "Xem lại kết quả" }).click()
  await expect(page.getByLabel("Tên món ăn", { exact: true })).toHaveValue("Gà đã chỉnh")
  state.confirmError = true
  await page.getByRole("button", { name: "Thay thế món cũ và lưu" }).click()
  await expect(page.getByRole("dialog").getByRole("alert").last()).toContainText("Error")
  expect(state.items[1][0].inputName).toBe("Món đã lưu")
  await expect(page.getByLabel("Tên món ăn", { exact: true })).toHaveValue("Gà đã chỉnh")
  state.confirmError = false
  let release = () => {}
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  let attempts = 0
  await page.route("**/api/meals/1/confirm-analysis", async (route) => {
    attempts++
    await held
    await route.fallback()
  })
  await page.getByRole("button", { name: "Thay thế món cũ và lưu" }).click()
  await expect(page.getByRole("dialog").getByRole("button", { name: "Đang xử lý…" })).toBeDisabled()
  await expect(page.getByLabel("Tên món ăn", { exact: true })).toBeDisabled()
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }),
  ).toBeDisabled()
  release()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  expect(attempts).toBe(1)
  await expect(page.getByRole("cell", { name: "Gà đã chỉnh", exact: true })).toBeVisible()
})

test("validates the review, supports removing every prediction and adding a manual food", async ({
  page,
}) => {
  const state = await setup(page)
  await login(page, "/meals/1")
  await analyze(page)
  await page.getByLabel("Chất đạm (g)").fill("1.001")
  await page.getByLabel("Tên món ăn", { exact: true }).fill(" ")
  await page.getByRole("button", { name: "Thay thế món cũ và lưu" }).click()
  await expect(page.getByText("Dinh dưỡng tối đa 2 chữ số thập phân")).toBeVisible()
  await expect(page.getByText("Vui lòng nhập tên món ăn")).toBeVisible()
  expect(state.requests.filter((entry) => entry.path.endsWith("/confirm-analysis"))).toHaveLength(0)
  await page.getByRole("button", { name: "Bỏ món 1 khỏi kết quả" }).click()
  await expect(page.getByRole("button", { name: "Thay thế món cũ và lưu" })).toBeDisabled()
  await page.getByRole("button", { name: "Thêm món vào kết quả" }).click()
  await page.getByLabel("Tên món ăn", { exact: true }).fill("Táo")
  await page.getByLabel("Năng lượng (kcal)").fill("52.25")
  await page.getByRole("button", { name: "Thay thế món cũ và lưu" }).click()
  await expect(page.getByRole("cell", { name: "Táo", exact: true })).toBeVisible()
})

for (const [code, message] of [
  [16001, "Chưa thể kết nối"],
  [16002, "mất quá nhiều thời gian"],
  [16003, "chưa hợp lệ"],
  [16004, "Chưa nhận diện"],
  [16005, "Không đọc được ảnh"],
] as const) {
  test(`shows localized AI error ${code} and only retries on user action`, async ({ page }) => {
    const state = await setup(page)
    state.analysisError = code
    await login(page, "/meals/1")
    await page.getByRole("button", { name: "Phân tích ảnh", exact: true }).click()
    await expect(page.getByRole("alert")).toContainText(message)
    expect(state.requests.filter((entry) => entry.path.endsWith("/analyze"))).toHaveLength(1)
    expect(state.items[1][0].inputName).toBe("Món đã lưu")
    state.analysisError = null
    await page.getByRole("button", { name: "Phân tích lại", exact: true }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
}

test("aborts waiting on cancellation or navigation and never opens a stale review", async ({
  page,
}) => {
  const state = await setup(page)
  state.meals.push({
    id: 2,
    mealType: "DINNER",
    mealDate: TEST_DATE,
    imageUrl: "https://images.example.test/other.png",
  })
  let release = () => {}
  let held = new Promise<void>((resolve) => {
    release = resolve
  })
  let requests = 0
  await page.route("**/api/meals/1/analyze", async (route) => {
    requests++
    const wait = held
    await wait
    await route.fallback()
  })
  await login(page, "/meals/1")
  await page.getByRole("button", { name: "Phân tích ảnh", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Đang phân tích ảnh")
  await expect(
    page.getByLabel("Chọn ảnh bữa ăn", { exact: true }).and(page.locator("input")),
  ).toBeDisabled()
  await page.getByRole("button", { name: "Hủy phân tích" }).click()
  release()
  await expect(page.getByRole("button", { name: "Phân tích ảnh", exact: true })).toBeEnabled()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.getByRole("button", { name: "Phân tích ảnh", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Đang phân tích ảnh")
  await page.locator('a[href="/meals"]').last().click()
  await page.getByRole("link", { name: "Bữa tối", exact: true }).click()
  release()
  await expect(page).toHaveURL(/\/meals\/2$/)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  expect(requests).toBe(2)
})

test("deletes a meal photo, clears its review and preserves saved foods", async ({ page }) => {
  const state = await setup(page)
  await login(page, "/meals/1")
  await analyze(page)
  await page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }).click()
  await page.getByRole("button", { name: "Xóa ảnh bữa ăn" }).click()
  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  expect(state.meals[0].imageUrl).toBeTruthy()
  await page.getByRole("button", { name: "Xóa ảnh bữa ăn" }).click()
  await page.getByRole("button", { name: "Xác nhận xóa" }).click()
  await expect(page.getByRole("button", { name: "Phân tích ảnh", exact: true })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Xem lại kết quả" })).toHaveCount(0)
  await expect(page.getByRole("cell", { name: "Món đã lưu", exact: true })).toBeVisible()
  expect(state.meals[0].imageUrl).toBeNull()
  await page.reload()
  await expect(page.getByRole("button", { name: "Phân tích ảnh", exact: true })).toBeDisabled()
})

test("deletes the avatar and restores initials in profile and navigation", async ({ page }) => {
  const state = await setup(page)
  state.users[0].avatarUrl = "https://images.example.test/avatar.png"
  await login(page, "/profile")
  await page.getByRole("button", { name: "Xóa ảnh đại diện" }).click()
  await page.getByRole("button", { name: "Xác nhận xóa" }).click()
  await expect(page.getByRole("img", { name: "Ảnh đại diện", exact: true })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Xóa ảnh đại diện" })).toHaveCount(0)
  expect(state.users[0].avatarUrl).toBeNull()
  await page.reload()
  await expect(page.getByRole("img", { name: "Ảnh đại diện", exact: true })).toHaveCount(0)
})
