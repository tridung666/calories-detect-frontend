import { useMutation, useQueryClient } from "@tanstack/react-query"

import { i18n } from "@/lib/i18n/i18n"
import {
  changePasswordApi,
  googleLoginApi,
  logoutApi,
  registerApi,
} from "@/features/auth/api/auth-api"
import { tokenStorage } from "@/lib/api/token-storage"
import { notification } from "@/lib/notification"

export const useRegister = () => useMutation({ mutationFn: registerApi })

export const useGoogleLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: googleLoginApi,
    onSuccess: ({ accessToken, refreshToken }) => {
      queryClient.clear()
      tokenStorage.setTokens(accessToken, refreshToken)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      tokenStorage.clearTokens()
      queryClient.clear()
    },
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => notification.success(i18n.t("profile:password.success")),
  })
