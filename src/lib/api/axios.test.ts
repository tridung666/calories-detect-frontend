import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { tokenStorage } from "@/lib/api/token-storage"
import { apiClient } from "@/lib/axios"

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

beforeEach(() => {
  const storage = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
  })
  vi.stubGlobal("window", new EventTarget())
  tokenStorage.setTokens("old-access", "old-refresh")
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("authenticated API requests", () => {
  it("refreshes once for concurrent 401 responses and replays each request", async () => {
    let refreshes = 0
    apiClient.defaults.adapter = async (config) => {
      if (config.url === "/auth/refresh-token") {
        refreshes += 1
        expect(config.headers.Authorization).toBeUndefined()
        return response(config, { accessToken: "new-access", refreshToken: "new-refresh" })
      }
      if (config.headers.Authorization !== "Bearer new-access") rejectRequest(config)
      return response(config, config.url)
    }
    const results = await Promise.all([
      apiClient.get("/meal"),
      apiClient.get("/user/1"),
      apiClient.get("/meal/1/items"),
    ])
    expect(results.map((result) => result.data.data)).toEqual(["/meal", "/user/1", "/meal/1/items"])
    expect(refreshes).toBe(1)
    expect(tokenStorage.getRefreshToken()).toBe("new-refresh")
  })

  it("ends the session when refresh is rejected without entering a retry loop", async () => {
    let requests = 0
    apiClient.defaults.adapter = async (config) => {
      requests += 1
      return rejectRequest(config)
    }
    await expect(apiClient.get("/meal")).rejects.toBeInstanceOf(AxiosError)
    expect(requests).toBe(2)
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it("does not refresh or attach an old token when credentials are rejected", async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      expect(config.headers.Authorization).toBeUndefined()
      return rejectRequest(config)
    })
    apiClient.defaults.adapter = adapter
    await expect(
      apiClient.post("/auth/login", { email: "test@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(AxiosError)
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(tokenStorage.getAccessToken()).toBe("old-access")
  })

  it("stops after the refreshed access token is also rejected", async () => {
    let requests = 0
    apiClient.defaults.adapter = async (config) => {
      requests += 1
      if (config.url === "/auth/refresh-token")
        return response(config, { accessToken: "new-access", refreshToken: "new-refresh" })
      return rejectRequest(config)
    }
    await expect(apiClient.get("/meal")).rejects.toBeInstanceOf(AxiosError)
    expect(requests).toBe(3)
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it("revokes the rotated refresh token when logout needs an access-token refresh", async () => {
    let revokedToken = ""
    apiClient.defaults.adapter = async (config) => {
      if (config.url === "/auth/refresh-token")
        return response(config, { accessToken: "new-access", refreshToken: "new-refresh" })
      if (config.headers.Authorization !== "Bearer new-access") rejectRequest(config)
      revokedToken = (JSON.parse(String(config.data)) as { refreshToken: string }).refreshToken
      return response(config, null)
    }
    await apiClient.post("/auth/logout")
    expect(revokedToken).toBe("new-refresh")
  })

  it("never restores a session when logout happens during refresh", async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === "/auth/refresh-token") {
        tokenStorage.clearTokens()
        return response(config, { accessToken: "late-access", refreshToken: "late-refresh" })
      }
      return rejectRequest(config)
    }
    await expect(apiClient.get("/meal")).rejects.toThrow("Phiên đăng nhập đã thay đổi")
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it("never replays an old account's request under a new account", async () => {
    let requests = 0
    apiClient.defaults.adapter = async (config) => {
      requests += 1
      tokenStorage.setTokens("another-account", "another-refresh")
      return rejectRequest(config)
    }
    await expect(apiClient.get("/meal")).rejects.toThrow("Session changed")
    expect(requests).toBe(1)
    expect(tokenStorage.getAccessToken()).toBe("another-account")
  })
})
