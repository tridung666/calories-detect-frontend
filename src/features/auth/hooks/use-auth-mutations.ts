import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router"

import { getReturnTo } from "@/features/auth/lib/session"

import { googleLoginApi, logoutApi, registerApi } from "@/features/auth/api/auth-api"
import { tokenStorage } from "@/lib/api/token-storage"
import { notification } from "@/lib/notification"
import { getApiErrorMessage } from "@/lib/api/api-error"

const notifyError = (error: unknown) => notification.error(getApiErrorMessage(error))

export const useRegister = () => useMutation({ mutationFn: registerApi, onError: notifyError })
export const useGoogleLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: googleLoginApi,
    onError: notifyError,
    onSuccess: ({ accessToken, expiresIn }) => {
      queryClient.clear()
      tokenStorage.setAccessToken(accessToken, { expiresIn })
      void navigate(getReturnTo(location.search), { replace: true })
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutApi,
    onError: notifyError,
    onMutate: () => {
      queryClient.clear()
    },
  })
}
