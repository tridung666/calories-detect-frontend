import { Navigate, Outlet, useLocation } from "react-router"

import { ErrorState, PageLoading } from "@/components/ui/feedback"
import { useSession } from "@/features/auth/hooks/use-session"
import { useProfile } from "@/features/profile/hooks/use-profile"

export const ProtectedRoute = () => {
  const session = useSession()
  const location = useLocation()
  if (!session) {
    return (
      <Navigate
        to={`/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }
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
