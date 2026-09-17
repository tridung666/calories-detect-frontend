import type { RegisterFormValues, ChangePasswordValues } from "@/features/auth/schemas/auth-schema"
import type { LoginResponse } from "@/features/auth/types/login"
import type { ApiResponse } from "@/lib/api/api-types"
import { apiClient } from "@/lib/axios"

export const registerApi = async ({ fullName, email, password }: RegisterFormValues) => {
  const response = await apiClient.post<ApiResponse<unknown>>("/auth/register", {
    fullName,
    email,
    password,
  })
  return response.data.data
}

export const googleLoginApi = async (idToken: string) => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/google", { idToken })
  return response.data.data
}

export const logoutApi = async () => {
  const response = await apiClient.post<ApiResponse<unknown>>("/auth/logout")
  return response.data.data
}

export const changePasswordApi = async (payload: ChangePasswordValues) => {
  const response = await apiClient.put<ApiResponse<unknown>>("/auth/change-password", payload)
  return response.data.data
}
