import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { logoutApi } from "@/features/auth/api/auth-api"
import { tokenStorage } from "@/lib/api/token-storage"
import { apiClient, refreshAccessToken } from "@/lib/axios"

const response = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse => ({
  config,
  data: { success: status === 200, code: status, data },
  status,
  statusText: String(status),
  headers: {},
})
const rejectRequest = (config: InternalAxiosRequestConfig, status = 401): never => {
  throw new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    config,
    undefined,
    response(config, null, status),
  )
}
const originalAdapter = apiClient.defaults.adapter
const adapter = (handle: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>) => {
  apiClient.defaults.adapter = async (config) => {
    expect(config.withCredentials).toBe(true)
    if (config.url === "/auth/csrf") return response(config, { token: "masked-csrf" })
    if (
      ["/auth/login", "/auth/google", "/auth/refresh-token", "/auth/logout"].includes(
        config.url ?? "",
      )
    )
      expect(config.headers["X-XSRF-TOKEN"]).toBe("masked-csrf")
    return handle(config)
  }
}
beforeEach(() => {
  tokenStorage.setAccessToken("old-access")
})
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  tokenStorage.clearTokens()
  vi.unstubAllGlobals()
})

describe("cookie-backed authentication", () => {
  it("refreshes once for concurrent 401s and replays every request", async () => {
    let refreshes = 0
    adapter(async (config) => {
      if (config.url === "/auth/refresh-token") {
        refreshes++
        expect(config.data).toBeUndefined()
        expect(config.headers.Authorization).toBeUndefined()
        return response(config, { accessToken: "new-access", expiresIn: 900 })
      }
      if (config.headers.Authorization !== "Bearer new-access") rejectRequest(config)
      return response(config, config.url)
    })
    const results = await Promise.all([
      apiClient.get("/meal"),
      apiClient.get("/user/1"),
      apiClient.get("/meal/1/items"),
    ])
    expect(results.map((r) => r.data.data)).toEqual(["/meal", "/user/1", "/meal/1/items"])
    expect(refreshes).toBe(1)
    expect(tokenStorage.getAccessToken()).toBe("new-access")
  })

  it("refreshes expired access tokens before sending concurrent protected requests", async () => {
    tokenStorage.setAccessToken("expired", { expiresIn: -1 })
    const paths: string[] = []
    adapter(async (config) => {
      paths.push(config.url!)
      if (config.url === "/auth/refresh-token")
        return response(config, { accessToken: "fresh", expiresIn: 900 })
      expect(config.headers.Authorization).toBe("Bearer fresh")
      return response(config, null)
    })
    await Promise.all([apiClient.get("/meal"), apiClient.get("/user/1")])
    expect(paths[0]).toBe("/auth/refresh-token")
    expect(paths.filter((p) => p === "/auth/refresh-token")).toHaveLength(1)
  })

  it("restores a page-reload session with just the HttpOnly cookie", async () => {
    tokenStorage.clearTokens()
    adapter(async (config) => {
      expect(config.url).toBe("/auth/refresh-token")
      expect(config.data).toBeUndefined()
      expect(config.headers.Authorization).toBeUndefined()
      return response(config, { accessToken: "restored", expiresIn: 900 })
    })
    await expect(refreshAccessToken()).resolves.toBe("restored")
    expect(tokenStorage.getExpiresAt()).toBeGreaterThan(Date.now())
  })

  it("ends a rejected session without a retry loop", async () => {
    let requests = 0
    adapter(async (config) => {
      requests++
      return rejectRequest(config)
    })
    await expect(apiClient.get("/meal")).rejects.toBeInstanceOf(AxiosError)
    expect(requests).toBe(2)
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it("stops after the refreshed access token is rejected", async () => {
    let requests = 0
    adapter(async (config) => {
      requests++
      if (config.url === "/auth/refresh-token") return response(config, { accessToken: "new" })
      return rejectRequest(config)
    })
    await expect(apiClient.get("/meal")).rejects.toBeInstanceOf(AxiosError)
    expect(requests).toBe(3)
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it.each([
    "/auth/login",
    "/auth/google",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/register",
    "/auth/verify-email",
    "/auth/resend-otp",
  ])("does not attach Bearer or retry public errors at %s", async (path) => {
    const handle = vi.fn(async (config: InternalAxiosRequestConfig) => {
      expect(config.headers.Authorization).toBeUndefined()
      return rejectRequest(config)
    })
    adapter(handle)
    await expect(
      apiClient.post(path, {}, { headers: { Authorization: "Bearer stale" } }),
    ).rejects.toBeInstanceOf(AxiosError)
    expect(handle).toHaveBeenCalledTimes(1)
    expect(tokenStorage.getAccessToken()).toBe("old-access")
  })

  it.each(["/auth/change-password/request", "/auth/google/link", "/auth/set-password"])(
    "keeps %s authenticated and preserves business errors",
    async (path) => {
      const handle = vi.fn(async (config: InternalAxiosRequestConfig) => {
        expect(config.headers.Authorization).toBe("Bearer old-access")
        return rejectRequest(config, 400)
      })
      adapter(handle)
      await expect(apiClient.post(path, {})).rejects.toBeInstanceOf(AxiosError)
      expect(handle).toHaveBeenCalledTimes(1)
    },
  )

  it("logs out without a body or Bearer token, even with expired access", async () => {
    tokenStorage.setAccessToken("expired", { expiresIn: -1 })
    const handle = vi.fn(async (config: InternalAxiosRequestConfig) => {
      expect(config.url).toBe("/auth/logout")
      expect(config.headers.Authorization).toBeUndefined()
      expect(config.data).toBeUndefined()
      expect(tokenStorage.getAccessToken()).toBeNull()
      return response(config, "Logout successful")
    })
    adapter(handle)
    await logoutApi()
    expect(handle).toHaveBeenCalledTimes(1)
  })

  it("clears access even when logout fails", async () => {
    adapter(async (config) => rejectRequest(config, 503))
    await expect(logoutApi()).rejects.toBeInstanceOf(AxiosError)
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it("never restores a session when logout happens during refresh", async () => {
    adapter(async (config) => {
      if (config.url === "/auth/refresh-token") {
        tokenStorage.clearTokens()
        return response(config, { accessToken: "late" })
      }
      return rejectRequest(config)
    })
    await expect(apiClient.get("/meal")).rejects.toThrow("Session changed")
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it.each([200, 401])(
    "rejects old account responses (%s) after account switching",
    async (status) => {
      adapter(async (config) => {
        tokenStorage.setAccessToken("other-account")
        if (status === 401) rejectRequest(config)
        return response(config, { private: "old-account" })
      })
      await expect(apiClient.get("/meal")).rejects.toThrow("Session changed")
      expect(tokenStorage.getAccessToken()).toBe("other-account")
    },
  )

  it.each([undefined, 403, 500, 503])(
    "preserves access on transient/CSRF refresh failure (%s)",
    async (status) => {
      adapter(async (config) => {
        if (config.url === "/auth/refresh-token") {
          if (status) return rejectRequest(config, status)
          throw new AxiosError("Network Error", "ERR_NETWORK", config)
        }
        return rejectRequest(config)
      })
      await expect(apiClient.get("/meal")).rejects.toBeInstanceOf(AxiosError)
      expect(tokenStorage.getAccessToken()).toBe("old-access")
    },
  )

  it("rejects unsuccessful HTTP 200 envelopes", async () => {
    adapter(async (config) => ({
      ...response(config, null),
      data: { success: false, code: 11006 },
    }))
    await expect(apiClient.post("/auth/verify-email")).rejects.toMatchObject({
      response: { data: { code: 11006 } },
    })
  })

  it("serializes refresh and logout so logout revokes the latest cookie", async () => {
    let tail = Promise.resolve<unknown>(undefined)
    vi.stubGlobal("navigator", {
      locks: {
        request: (_name: string, callback: () => Promise<unknown>) => {
          const result = tail.then(callback)
          tail = result.catch(() => undefined)
          return result
        },
      },
    })
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    const paths: string[] = []
    adapter(async (config) => {
      paths.push(config.url!)
      if (config.url === "/auth/refresh-token") {
        started()
        await gate
        return response(config, { accessToken: "late" })
      }
      return response(config, null)
    })
    const refresh = refreshAccessToken().catch((error: unknown) => error)
    await ready
    const logout = logoutApi()
    release()
    await logout
    expect(await refresh).toMatchObject({ message: "Session changed" })
    expect(paths).toEqual(["/auth/refresh-token", "/auth/logout"])
    expect(tokenStorage.getAccessToken()).toBeNull()
  })
})
