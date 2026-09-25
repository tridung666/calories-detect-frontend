import { Navigate, Outlet, useLocation, useNavigation } from "react-router"

import { ErrorState, PageLoading } from "@/components/ui/feedback"
import { useSession } from "@/features/auth/hooks/use-session"
import { useProfile } from "@/features/profile/hooks/use-profile"

export const ProtectedRoute = () => {
  const session = useSession()
  const profile = useProfile()
  const location = useLocation()
  const navigation = useNavigation()
  if (!session) {
    // Let an explicit sign-out navigation finish loading its lazy Login page.
    // Otherwise this guard can overwrite its success notice and destination.
    if (navigation.location?.pathname === "/auth/login") return <PageLoading />
    return (
      <Navigate
        to={`/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }
  if (profile.isPending) return <PageLoading />
  if (profile.isError)
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
  return <Outlet />
}

export const AdminRoute = () => {
  const profile = useProfile()
  if (profile.isPending) return <PageLoading />
  if (profile.isError)
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
  if (profile.data.role !== "ADMIN") return <Navigate to="/dashboard" replace />
  return <Outlet />
}
