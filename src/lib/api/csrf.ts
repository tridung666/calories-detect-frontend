import type { AxiosInstance } from "axios"
import type { ApiSuccessResponse } from "@/lib/api/api-types"

export const cookieAuthPaths = new Set([
  "/auth/login",
  "/auth/google",
  "/auth/refresh-token",
  "/auth/logout",
])

export const createCsrfLoader = (client: AxiosInstance) => {
  let pending: Promise<string> | undefined
  return () => {
    // Reload for each cookie operation: another tab may have changed the CSRF cookie.
    pending ??= client
      .get<ApiSuccessResponse<{ token: string }>>("/auth/csrf")
      .then(({ data }) => data.data.token)
      .finally(() => {
        pending = undefined
      })
    return pending
  }
}
