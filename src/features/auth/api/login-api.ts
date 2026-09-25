import type { ApiSuccessResponse } from "@/lib/api/api-types"
import { withSessionLock } from "@/lib/api/session-lock"
import { apiClient } from "@/lib/axios"
import type { LoginRequest, LoginResponse, LoginResult } from "../types/login"

export const loginApi = async (payload: LoginRequest): Promise<LoginResult> =>
  withSessionLock(async () => {
    const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>("/auth/login", payload)

    return {
      message: response.data.message,
      tokens: response.data.data,
    }
  })
