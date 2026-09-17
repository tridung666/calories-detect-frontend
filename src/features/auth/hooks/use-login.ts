import { useMutation, useQueryClient } from "@tanstack/react-query"

import { loginApi } from "@/features/auth/api/login-api"
import { tokenStorage } from "@/lib/api/token-storage"

export const useLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginApi,
    onSuccess: ({ tokens: { accessToken, refreshToken } }) => {
      queryClient.clear()
      tokenStorage.setTokens(accessToken, refreshToken)
    },
  })
}
