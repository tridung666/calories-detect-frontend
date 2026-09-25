import type { QueryClient } from "@tanstack/react-query"

import { readSession } from "@/features/auth/lib/session"
import type { User } from "@/features/profile/types/user"
import { tokenStorage } from "@/lib/api/token-storage"

export const clearPasswordResetSession = (
  queryClient: QueryClient,
  email: string,
  changeUserId?: number,
) => {
  const session = readSession(tokenStorage.getAccessToken())
  if (!session) return
  const profile = queryClient.getQueryData<User>(["profile", session.userId])
  const normalize = (value: string) => value.trim().toLowerCase()
  const sameAccount =
    changeUserId !== undefined
      ? session.userId === changeUserId
      : [session.sub, profile?.email].some(
          (value) => value && normalize(value) === normalize(email),
        )
  if (sameAccount) {
    tokenStorage.clearTokens()
    queryClient.clear()
  }
}
