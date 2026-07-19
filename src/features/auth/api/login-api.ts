import type { ApiResponse } from "@/lib/api/api-types"
import { apiClient } from "@/lib/axios"

import type {
  LoginRequest,
  LoginResponse,
  LoginResult,
} from "../types/login"

export async function loginApi(
  payload: LoginRequest,
): Promise<LoginResult> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    payload,
  )

  return {
    message: response.data.message,
    tokens: response.data.data,
  }
}
