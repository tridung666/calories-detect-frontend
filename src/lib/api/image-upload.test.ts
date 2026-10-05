import { afterEach, expect, it } from "vitest"

import { uploadMealImage } from "@/features/meals/api/meals-api"
import { uploadAvatar } from "@/features/profile/api/profile-api"
import { tokenStorage } from "@/lib/api/token-storage"
import { apiClient } from "@/lib/axios"
import { imageFileSchema, maxImageBytes } from "@/lib/image-file"

const adapter = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = adapter
  tokenStorage.clearTokens()
})

it("sends authenticated multipart files to both image endpoints and unwraps the response", async () => {
  tokenStorage.setAccessToken("upload-token")
  const file = new File(["image"], "meal.png", { type: "image/png" })
  const paths: (string | undefined)[] = []
  apiClient.defaults.adapter = async (config) => {
    paths.push(config.url)
    expect(config.method).toBe("put")
    expect(config.headers.Authorization).toBe("Bearer upload-token")
    expect(config.headers.getContentType()).not.toBe("application/json")
    expect(config.withCredentials).toBe(true)
    expect(config.data).toBeInstanceOf(FormData)
    expect([...config.data.keys()]).toEqual(["file"])
    expect(config.data.get("file")).toBe(file)
    return {
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: { code: 200, data: { id: 1 } },
    }
  }
  expect(await uploadAvatar(file)).toEqual({ id: 1 })
  expect(await uploadMealImage(42, file)).toEqual({ id: 1 })
  expect(paths).toEqual(["/users/me/avatar", "/meals/42/image"])
})

it("accepts backend image types up to 10 MiB and rejects empty, oversized or unsupported files", () => {
  expect(maxImageBytes).toBe(10 * 1024 * 1024)
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    for (const size of [5 * 1024 * 1024 + 1, 10 * 1024 * 1024]) {
      expect(
        imageFileSchema.safeParse(new File([new Uint8Array(size)], "image", { type })).success,
      ).toBe(true)
    }
  }
  for (const file of [
    new File([], "empty.png", { type: "image/png" }),
    new File(["gif"], "image.gif", { type: "image/gif" }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
  ])
    expect(imageFileSchema.safeParse(file).success).toBe(false)
})
