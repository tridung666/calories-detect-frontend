import { useQuery } from "@tanstack/react-query"

import { useSession } from "@/features/auth/hooks/use-session"
import { getProfile } from "@/features/profile/api/profile-api"

export const useProfile = () => {
  const session = useSession()
  const userId = session?.userId ?? 0
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: ({ signal }) => getProfile(userId, signal),
    enabled: userId > 0,
  })
}
