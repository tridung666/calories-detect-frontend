import { useSyncExternalStore } from "react"

import { readSession } from "@/features/auth/lib/session"
import { tokenStorage } from "@/lib/api/token-storage"

export const useSession = () => {
  const token = useSyncExternalStore(
    tokenStorage.subscribe,
    tokenStorage.getAccessToken,
    () => null,
  )
  return readSession(token)
}
