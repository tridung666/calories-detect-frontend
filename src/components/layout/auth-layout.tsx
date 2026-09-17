import { ChartNoAxesCombined, ClipboardList, Utensils } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router"
import { useTranslation } from "react-i18next"

import { Brand } from "@/components/layout/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { useSession } from "@/features/auth/hooks/use-session"
import { getReturnTo } from "@/features/auth/lib/session"

export const AuthLayout = () => {
  const { t } = useTranslation(["common", "auth"])

  const benefits = [
    {
      icon: ClipboardList,
      title: t("common:navigation.meals"),
      description: t("auth:benefits.diary"),
    },
    {
      icon: Utensils,
      title: t("auth:benefits.portionsTitle"),
      description: t("auth:benefits.portions"),
    },
    {
      icon: ChartNoAxesCombined,
      title: t("auth:benefits.overviewTitle"),
      description: t("auth:benefits.overview"),
    },
  ]

  const session = useSession()
  const location = useLocation()
  if (session) return <Navigate to={getReturnTo(location.search)} replace />

  return (
    <div className="min-h-svh bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 md:px-8">
        <Brand />
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-8 md:px-8 lg:min-h-[calc(100svh-104px)] lg:grid-cols-2 lg:py-12">
        <section className="hidden space-y-10 lg:block">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border bg-card px-4 py-2 text-xs font-medium tracking-wide text-primary">
              {t("auth:hero.eyebrow")}
            </span>
            <h1 className="max-w-lg text-5xl leading-tight font-semibold tracking-tight">
              {t("auth:hero.title")}
              <br />
              <span className="text-primary">{t("auth:hero.highlight")}</span>
            </h1>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              {t("auth:hero.description")}
            </p>
          </div>
          <div className="max-w-md space-y-6">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div className="flex gap-4" key={title}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
