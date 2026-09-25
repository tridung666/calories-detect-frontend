import { afterEach, expect, it, vi } from "vitest"

import {
  forgotPasswordApi,
  requestPasswordChangeApi,
  resetPasswordApi,
} from "@/features/auth/api/auth-api"
import { tokenStorage } from "@/lib/api/token-storage"
import { apiClient } from "@/lib/axios"

const originalAdapter = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  vi.unstubAllGlobals()
})

it("uses exact JSON bodies, public reset and authenticated change requests", async () => {
  tokenStorage.setAccessToken("access-token")
  const received: { path?: string; authorization: unknown; body: unknown }[] = []
  apiClient.defaults.adapter = async (config) => {
    expect(config.method).toBe("post")
    expect(config.headers["Content-Type"]).toBe("application/json")
    received.push({
      path: config.url,
      authorization: config.headers.Authorization,
      body: JSON.parse(config.data as string),
    })
    return {
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: { success: true, code: 200, message: "Success", data: "result" },
    }
  }
  expect(await forgotPasswordApi({ email: "user@example.com" })).toBe("result")
  expect(await requestPasswordChangeApi({ currentPassword: " Current123! " })).toBe("result")
  const reset = {
    email: "user@example.com",
    otp: "012345",
    newPassword: " Current123! ",
    confirmPassword: " Current123! ",
  }
  expect(await resetPasswordApi(reset)).toBe("result")
  expect(received).toEqual([
    {
      path: "/auth/forgot-password",
      authorization: undefined,
      body: { email: "user@example.com" },
    },
    {
      path: "/auth/change-password/request",
      authorization: "Bearer access-token",
      body: { currentPassword: " Current123! " },
    },
    { path: "/auth/reset-password", authorization: undefined, body: reset },
  ])
})

it("uses protected Google link and first-password endpoints without additional credentials", async () => {
  tokenStorage.setAccessToken("application-token")
  const { linkGoogleApi, setPasswordApi, registerApi } =
    await import("@/features/auth/api/auth-api")
  const requests: { path?: string; body: unknown }[] = []
  apiClient.defaults.adapter = async (config) => {
    if (config.url === "/auth/register") expect(config.headers.Authorization).toBeUndefined()
    else expect(config.headers.Authorization).toBe("Bearer application-token")
    requests.push({ path: config.url, body: JSON.parse(config.data as string) })
    return {
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: {
        success: true,
        code: 200,
        message: "Success",
        data:
          config.url === "/auth/register"
            ? { email: "canonical@example.com", emailVerified: false }
            : "Success",
      },
    }
  }
  await linkGoogleApi("google-id-token")
  await setPasswordApi({ newPassword: " Password123! ", confirmPassword: " Password123! " })
  expect(
    await registerApi({
      fullName: "Test User",
      email: "Canonical@example.com",
      password: "Password123!",
    }),
  ).toMatchObject({ email: "canonical@example.com" })
  expect(requests.slice(0, 2)).toEqual([
    { path: "/auth/google/link", body: { idToken: "google-id-token" } },
    {
      path: "/auth/set-password",
      body: { newPassword: " Password123! ", confirmPassword: " Password123! " },
    },
  ])
})
