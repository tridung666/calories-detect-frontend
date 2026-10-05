import { expect, test } from "@playwright/test"

import { login, mockApi, TEST_DATE } from "./fixtures"

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
)
const image = { name: "photo.png", mimeType: "image/png", buffer: png }

test("previews, validates and uploads an avatar, updating navigation and surviving reload", async ({
  page,
}, testInfo) => {
  const state = await mockApi(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const savedUrl = "https://images.example.test/avatar.png"
  await page.route(savedUrl, (route) => route.fulfill({ contentType: "image/png", body: png }))
  let uploads = 0
  await page.route("**/api/users/me/avatar", async (route) => {
    uploads++
    const request = route.request()
    expect(request.method()).toBe("PUT")
    expect(request.headers()["content-type"]).toMatch(/^multipart\/form-data; boundary=/)
    expect(request.headers().authorization).toMatch(/^Bearer /)
    expect(request.postDataBuffer()?.toString()).toContain('name="file"; filename="photo.png"')
    Object.assign(state.users[0], { avatarUrl: savedUrl })
    await route.fulfill({ json: { code: 200, data: state.users[0] } })
  })
  await login(page, "/profile")
  const picker = page.getByLabel("Ảnh đại diện", { exact: true }).and(page.locator("input"))
  await picker.setInputFiles({ name: "empty.png", mimeType: "image/png", buffer: Buffer.alloc(0) })
  await expect(page.getByRole("alert")).toContainText("không rỗng")
  await picker.setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole("alert")).toContainText("5 MiB")
  expect(uploads).toBe(0)
  await picker.setInputFiles(image)
  await expect(page.getByRole("img", { name: "Ảnh đại diện", exact: true })).toHaveAttribute(
    "src",
    /^blob:/,
  )
  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toHaveCount(0)
  await picker.setInputFiles(image)
  await page.getByRole("button", { name: "Tải ảnh lên" }).click()
  await expect(page.getByRole("img", { name: "Ảnh đại diện", exact: true })).toHaveAttribute(
    "src",
    savedUrl,
  )
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toHaveCount(0)
  expect(uploads).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath("avatar-mobile.png"), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(
    page.getByRole("link").filter({ hasText: "test@example.com" }).locator("img"),
  ).toHaveAttribute("src", savedUrl)
  await page.reload()
  await expect(page.getByRole("img", { name: "Ảnh đại diện", exact: true })).toHaveAttribute(
    "src",
    savedUrl,
  )
})

test("meal image failures allow retry, pending prevents duplicates, replacement persists", async ({
  page,
}, testInfo) => {
  const state = await mockApi(page)
  const oldUrl = "https://images.example.test/old.png"
  const savedUrl = "https://images.example.test/meal.png"
  state.meals = [{ id: 1, mealType: "LUNCH", mealDate: TEST_DATE, imageUrl: oldUrl }]
  await page.route("https://images.example.test/*", (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  )
  let uploads = 0
  let release: () => void = () => {}
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route("**/api/meals/1/image", async (route) => {
    uploads++
    expect(route.request().method()).toBe("PUT")
    expect(route.request().headers()["content-type"]).toMatch(/^multipart\/form-data; boundary=/)
    if (uploads === 1)
      return route.fulfill({ status: 500, json: { code: 15002, message: "Failure" } })
    await held
    state.meals[0].imageUrl = savedUrl
    await route.fulfill({ json: { code: 200, data: state.meals[0] } })
  })
  await login(page, "/meals/1")
  const picker = page.getByLabel("Chọn ảnh bữa ăn", { exact: true }).and(page.locator("input"))
  const preview = page.getByRole("img", { name: "Chọn ảnh bữa ăn", exact: true })
  await expect(preview).toHaveAttribute("src", oldUrl)
  await picker.setInputFiles(image)
  await page.getByRole("button", { name: "Tải ảnh lên" }).click()
  await expect(page.getByRole("alert")).toContainText("Chưa thể tải ảnh lên")
  expect(state.meals[0].imageUrl).toBe(oldUrl)
  await page.getByRole("button", { name: "Tải ảnh lên" }).click()
  await expect(picker).toBeDisabled()
  await expect(page.getByRole("button", { name: "Hủy", exact: true })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Đang xử lý…", exact: true })).toBeDisabled()
  release()
  await expect(preview).toHaveAttribute("src", savedUrl)
  await expect(page.getByRole("alert")).toHaveCount(0)
  expect(uploads).toBe(2)
  await page.screenshot({ path: testInfo.outputPath("meal-image-desktop.png"), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath("meal-image-mobile.png"), fullPage: true })
  await page.reload()
  await expect(preview).toHaveAttribute("src", savedUrl)
})
