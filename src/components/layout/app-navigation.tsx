import { LayoutDashboard, LogOut, NotebookPen, UserRound, Users } from "lucide-react"
import { Link, NavLink } from "react-router"
import { useTranslation } from "react-i18next"

import { Brand } from "@/components/layout/brand"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/features/auth/hooks/use-auth-mutations"
import { useProfile } from "@/features/profile/hooks/use-profile"
import { getInitials } from "@/lib/format"
import { cn } from "@/lib/utils"

export const AppNavigation = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t } = useTranslation(["common", "auth"])

  const navigation = [
    { to: "/dashboard", label: t("common:navigation.dashboard"), icon: LayoutDashboard },
    { to: "/meals", label: t("common:navigation.meals"), icon: NotebookPen },
    { to: "/profile", label: t("common:navigation.profile"), icon: UserRound },
  ]

  const { data: profile } = useProfile()
  const logout = useLogout()
  const links =
    profile?.role === "ADMIN"
      ? [...navigation, { to: "/admin/users", label: t("common:navigation.users"), icon: Users }]
      : navigation

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <Brand compact />
      </div>
      <nav aria-label={t("common:navigation.main")} className="space-y-1 p-3 pt-6">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mt-auto space-y-2 border-t py-4">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-semibold"
          >
            {profile ? getInitials(profile.fullName) : <UserRound className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {profile?.fullName ?? t("common:navigation.yourAccount")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.email ?? t("common:navigation.viewAccount")}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="h-11 w-full justify-start gap-3 px-3 text-muted-foreground"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut aria-hidden="true" />
          {logout.isPending ? t("auth:logout.pending") : t("auth:logout.submit")}
        </Button>
      </div>
    </div>
  )
}
