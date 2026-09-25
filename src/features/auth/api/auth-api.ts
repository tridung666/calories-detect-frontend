import type {
  RegisterRequest,
  RegisteredUser,
  SetPasswordRequest,
  VerifyEmailRequest,
  ResendOtpRequest,
  ForgotPasswordRequest,
  RequestPasswordChangeRequest,
  ResetPasswordRequest,
} from "@/features/auth/types/auth"
import type { LoginResponse } from "@/features/auth/types/login"
import type { ApiSuccessResponse } from "@/lib/api/api-types"
import { withSessionLock } from "@/lib/api/session-lock"
import { tokenStorage } from "@/lib/api/token-storage"
import { apiClient } from "@/lib/axios"

export const registerApi = async ({ fullName, email, password }: RegisterRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<RegisteredUser>>("/auth/register", {
    fullName,
    email,
    password,
  })
  return response.data.data
}

export const googleLoginApi = (idToken: string) =>
  withSessionLock(async () => {
    const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>("/auth/google", {
      idToken,
    })
    return response.data.data
  })

export const verifyEmailApi = async ({ email, otp }: VerifyEmailRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/verify-email", {
    email,
    otp,
  })
  return response.data.data
}

export const resendOtpApi = async ({ email }: ResendOtpRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/resend-otp", { email })
  return response.data.data
}

export const logoutApi = async () => {
  tokenStorage.clearTokens()
  return withSessionLock(async () => {
    const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/logout")
    return response.data.data
  })
}

export const forgotPasswordApi = async ({ email }: ForgotPasswordRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/forgot-password", {
    email,
  })
  return response.data.data
}

export const requestPasswordChangeApi = async ({
  currentPassword,
}: RequestPasswordChangeRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>(
    "/auth/change-password/request",
    {
      currentPassword,
    },
  )
  return response.data.data
}

export const resetPasswordApi = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
}: ResetPasswordRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/reset-password", {
    email,
    otp,
    newPassword,
    confirmPassword,
  })
  return response.data.data
}

export const linkGoogleApi = async (idToken: string) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/google/link", {
    idToken,
  })
  return response.data.data
}

export const setPasswordApi = async ({ newPassword, confirmPassword }: SetPasswordRequest) => {
  const response = await apiClient.post<ApiSuccessResponse<string>>("/auth/set-password", {
    newPassword,
    confirmPassword,
  })
  return response.data.data
}
