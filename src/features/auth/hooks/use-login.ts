import { useMutation } from "@tanstack/react-query"

import { loginApi } from "@/features/auth/api/login-api"
import { tokenStorage } from "@/lib/api/token-storage"

export function useLogin() {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: ({ tokens: { accessToken, refreshToken } }) => {
      tokenStorage.setTokens(accessToken, refreshToken)
    },
  })
}
