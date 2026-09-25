import axios, { type InternalAxiosRequestConfig } from "axios"

import { cookieAuthPaths, createCsrfLoader } from "@/lib/api/csrf"
import { createTokenRefresher } from "@/lib/api/refresh-token"
import { tokenStorage } from "@/lib/api/token-storage"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || "/api",
  timeout: 10_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

const publicAuthPaths = new Set([
  "/auth/csrf",
  "/auth/logout",
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-otp",
  "/auth/google",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/reset-password",
])
const loadCsrfToken = createCsrfLoader(apiClient)
export const refreshAccessToken = createTokenRefresher(apiClient)
type RetryConfig = InternalAxiosRequestConfig & {
  retried?: boolean
  sessionVersion?: string | number
}

apiClient.interceptors.request.use(async (config: RetryConfig) => {
  config.sessionVersion ??= tokenStorage.getSessionVersion()
  if (cookieAuthPaths.has(config.url ?? "")) {
    config.headers["X-XSRF-TOKEN"] = await loadCsrfToken()
  }
  const expiry = tokenStorage.getExpiresAt()
  if (
    !publicAuthPaths.has(config.url ?? "") &&
    tokenStorage.getAccessToken() &&
    expiry !== undefined &&
    expiry <= Date.now()
  ) {
    await refreshAccessToken()
  }
  if (config.url !== "/auth/logout" && config.sessionVersion !== tokenStorage.getSessionVersion())
    throw new axios.CanceledError("Session changed")
  const accessToken = tokenStorage.getAccessToken()

  if (publicAuthPaths.has(config.url ?? "")) {
    config.headers.delete("Authorization")
  } else if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  } else {
    config.headers.delete("Authorization")
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const config: RetryConfig = response.config
    if (
      (!publicAuthPaths.has(config.url ?? "") ||
        ["/auth/login", "/auth/google"].includes(config.url ?? "")) &&
      config.sessionVersion !== tokenStorage.getSessionVersion()
    )
      throw new axios.CanceledError("Session changed")
    if (response.data?.success === false) {
      throw new axios.AxiosError(
        response.data.message,
        "ERR_BAD_RESPONSE",
        response.config,
        response.request,
        response,
      )
    }
    return response
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error)
    }
    const config: RetryConfig = error.config
    if (publicAuthPaths.has(config.url ?? "") || !config.headers.Authorization)
      return Promise.reject(error)
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
