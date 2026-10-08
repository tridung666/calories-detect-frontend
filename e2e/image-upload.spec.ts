import { expect, test } from "@playwright/test"

import { login, mockApi, TEST_DATE } from "./fixtures"

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
)
const image = { name: "photo.png", mimeType: "image/png", buffer: png }
const oversizedImage = {
  ...image,
  buffer: Buffer.concat([png, Buffer.alloc(12 * 1024 * 1024 - png.length)]),
}
const phoneImage = {
  ...image,
  buffer: Buffer.concat([png, Buffer.alloc(6 * 1024 * 1024 - png.length)]),
}

test("compresses an oversized avatar, updating navigation and surviving reload", async ({
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
    expect(request.postDataBuffer()?.toString()).toContain('name="file"; filename="photo.jpg"')
    expect(request.postDataBuffer()?.toString()).toContain("Content-Type: image/jpeg")
    expect(request.postDataBuffer()?.length).toBeLessThan(2 * 1024 * 1024)
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
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole("alert")).toContainText("JPEG, PNG hoặc WebP")
  expect(uploads).toBe(0)
  await picker.setInputFiles(image)
  await expect(page.getByText("Đã chọn: photo.png", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  await picker.setInputFiles(oversizedImage)
  await expect(page.getByRole("img", { name: "Ảnh đại diện", exact: true })).toHaveAttribute(
    "src",
    /^blob:/,
  )
  await page.getByRole("button", { name: "Hủy", exact: true }).click()
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toHaveCount(0)
  await picker.setInputFiles(oversizedImage)
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

test("6 MiB meal image failures allow retry, pending prevents duplicates, replacement persists", async ({
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
    expect(route.request().postDataBuffer()?.toString()).toContain('filename="photo.jpg"')
    expect(route.request().postDataBuffer()?.length).toBeLessThan(2 * 1024 * 1024)
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
  await picker.setInputFiles(phoneImage)
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

test("resizes a phone photo while preserving EXIF orientation and blocks analysis during compression", async ({
  page,
}) => {
  const state = await mockApi(page)
  state.meals = [{ id: 1, mealType: "LUNCH", mealDate: TEST_DATE, imageUrl: null }]
  await login(page, "/meals/1")
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 4032
    canvas.height = 3024
    const context = canvas.getContext("2d")!
    context.fillStyle = "red"
    context.fillRect(0, 0, 2016, 3024)
    context.fillStyle = "blue"
    context.fillRect(2016, 0, 2016, 3024)
    const encoded = canvas.toDataURL("image/jpeg", 0.95).split(",")[1]
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      // Hold encoding until the test has checked the processing controls.
      const testWindow = window as Window & { finishImagePreparation: () => void }
      testWindow.finishImagePreparation = () => {
        HTMLCanvasElement.prototype.toBlob = originalToBlob
        originalToBlob.call(this, callback, type, quality)
      }
    }
    return encoded
  })
  const jpeg = Buffer.from(base64, "base64")
  // TIFF orientation 6: rotate 90 degrees clockwise, as on portrait phone photos.
  const exif = Buffer.from(
    "ffe1002245786966000049492a0008000000010012010300010000000600000000000000",
    "hex",
  )
  const rotated = Buffer.concat([jpeg.subarray(0, 2), exif, jpeg.subarray(2)])
  const buffer = Buffer.concat([rotated, Buffer.alloc(12 * 1024 * 1024 - rotated.length)])
  const picker = page.getByLabel("Chọn ảnh bữa ăn", { exact: true }).and(page.locator("input"))
  await picker.setInputFiles({ name: "iphone.jpg", mimeType: "image/jpeg", buffer })
  await expect(page.getByRole("status").filter({ hasText: "Đang xử lý ảnh…" })).toBeVisible()
  await expect(picker).toBeDisabled()
  await expect(page.getByRole("button", { name: "Phân tích ảnh", exact: true })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toHaveCount(0)
  await page.evaluate(() => {
    const testWindow = window as Window & { finishImagePreparation: () => void }
    testWindow.finishImagePreparation()
  })
  const preview = page.getByRole("img", { name: "Chọn ảnh bữa ăn", exact: true })
  await expect(preview).toBeVisible()
  await expect(picker).toBeEnabled()
  const prepared = await preview.evaluate(async (element: HTMLImageElement) => {
    await element.decode()
    const canvas = document.createElement("canvas")
    canvas.width = element.naturalWidth
    canvas.height = element.naturalHeight
    const context = canvas.getContext("2d")!
    context.drawImage(element, 0, 0, canvas.width, canvas.height)
    return {
      width: element.naturalWidth,
      height: element.naturalHeight,
      top: [...context.getImageData(768, 100, 1, 1).data],
      bottom: [...context.getImageData(768, 1900, 1, 1).data],
    }
  })
  expect({ width: prepared.width, height: prepared.height }).toEqual({ width: 1536, height: 2048 })
  expect(prepared.top[0]).toBeGreaterThan(240)
  expect(prepared.top[2]).toBeLessThan(10)
  expect(prepared.bottom[0]).toBeLessThan(10)
  expect(prepared.bottom[2]).toBeGreaterThan(240)
})

test("reports compression failure and allows selecting another image", async ({ page }) => {
  await mockApi(page)
  await login(page, "/profile")
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      HTMLCanvasElement.prototype.toBlob = original
      callback(null)
    }
  })
  const picker = page.getByLabel("Ảnh đại diện", { exact: true }).and(page.locator("input"))
  await picker.setInputFiles(oversizedImage)
  await expect(page.getByRole("alert")).toContainText("Chưa thể nén ảnh")
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toHaveCount(0)
  await expect(picker).toBeEnabled()
  await picker.setInputFiles(oversizedImage)
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toBeEnabled()
  await expect(page.getByRole("alert")).toHaveCount(0)
})
