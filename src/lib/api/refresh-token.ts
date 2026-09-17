import type { AxiosInstance } from "axios"

import type { ApiResponse } from "@/lib/api/api-types"
import { tokenStorage } from "@/lib/api/token-storage"

type RefreshedTokens = { accessToken: string; refreshToken: string }

export const createTokenRefresher = (client: AxiosInstance) => {
  let pendingRefresh: Promise<string> | null = null

  return () => {
    if (pendingRefresh) return pendingRefresh
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      tokenStorage.clearTokens()
      return Promise.reject(new Error("Phiên đăng nhập đã hết hạn."))
    }
    pendingRefresh = client
      .post<ApiResponse<RefreshedTokens>>("/auth/refresh-token", { refreshToken })
      .then(({ data }) => {
        // A late refresh must never restore a session after logout/account switching.
        if (tokenStorage.getRefreshToken() !== refreshToken) {
          throw new Error("Phiên đăng nhập đã thay đổi.")
        }
        tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken, { isRefresh: true })
        return data.data.accessToken
      })
      .catch((error: unknown) => {
        if (tokenStorage.getRefreshToken() === refreshToken) tokenStorage.clearTokens()
        throw error
      })
      .finally(() => {
        pendingRefresh = null
      })
    return pendingRefresh
  }
}
