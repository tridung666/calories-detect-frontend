import axios, { type AxiosInstance } from "axios"

import type { LoginResponse } from "@/features/auth/types/login"
import type { ApiSuccessResponse } from "@/lib/api/api-types"
import { getApiErrorCode } from "@/lib/api/api-error"
import { withSessionLock } from "@/lib/api/session-lock"
import { tokenStorage } from "@/lib/api/token-storage"

export const isSessionRejected = (error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  return (
    status === 401 ||
    (status === 400 &&
      [10003, 11000, 11005, 13000, 13001, 13002, 13003].includes(getApiErrorCode(error) ?? 0))
  )
}

export const createTokenRefresher = (client: AxiosInstance) => {
  let pendingRefresh: Promise<string> | null = null
  return () => {
    if (pendingRefresh) return pendingRefresh
    const sessionVersion = tokenStorage.getSessionVersion()
    const previousToken = tokenStorage.getAccessToken()
    const assertSession = () => {
      if (sessionVersion !== tokenStorage.getSessionVersion())
        throw new axios.CanceledError("Session changed")
    }
    pendingRefresh = withSessionLock(async () => {
      assertSession()
      const current = tokenStorage.getAccessToken()
      if (current && current !== previousToken) return current
      try {
        const { data } = await client.post<ApiSuccessResponse<LoginResponse>>("/auth/refresh-token")
        assertSession()
        tokenStorage.setAccessToken(data.data.accessToken, {
          isRefresh: true,
          expiresIn: data.data.expiresIn,
        })
        return data.data.accessToken
      } catch (error) {
        if (isSessionRejected(error) && sessionVersion === tokenStorage.getSessionVersion())
          tokenStorage.clearTokens()
        throw error
      }
    }).finally(() => {
      pendingRefresh = null
    })
    return pendingRefresh
  }
}
