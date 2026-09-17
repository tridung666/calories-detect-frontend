import axios, { type InternalAxiosRequestConfig } from "axios"

import { createTokenRefresher } from "@/lib/api/refresh-token"
import { tokenStorage } from "@/lib/api/token-storage"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || "/api",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
})

const publicAuthPaths = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/refresh-token",
])
const refreshAccessToken = createTokenRefresher(apiClient)
type RetryConfig = InternalAxiosRequestConfig & { retried?: boolean; sessionVersion?: number }

apiClient.interceptors.request.use((config: RetryConfig) => {
  config.sessionVersion ??= tokenStorage.getSessionVersion()
  const accessToken = tokenStorage.getAccessToken()

  if (accessToken && !publicAuthPaths.has(config.url ?? "")) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  // Logout revokes the latest refresh token, including after a 401 retry.
  if (config.url === "/auth/logout") {
    config.data = JSON.stringify({ refreshToken: tokenStorage.getRefreshToken() })
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error)
    }
    const config: RetryConfig = error.config
    if (publicAuthPaths.has(config.url ?? "")) return Promise.reject(error)
    if (config.sessionVersion !== tokenStorage.getSessionVersion()) {
      return Promise.reject(new axios.CanceledError("Session changed"))
    }
    if (config.retried) {
      tokenStorage.clearTokens()
      return Promise.reject(error)
    }
    config.retried = true
    const currentToken = tokenStorage.getAccessToken()
    const sentToken = config.headers.Authorization
    // Another concurrent request may already have completed the refresh.
    const accessToken =
      currentToken && sentToken !== `Bearer ${currentToken}`
        ? currentToken
        : await refreshAccessToken()
    config.headers.Authorization = `Bearer ${accessToken}`
    return apiClient.request(config)
  },
)
