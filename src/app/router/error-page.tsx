import { Home, SearchX } from "lucide-react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { EmptyState } from "@/components/ui/feedback"
import { usePageTitle } from "@/hooks/use-page-title"

export const NotFoundPage = () => {
  const { t } = useTranslation(["common"])
  usePageTitle(t("notFound.title"))
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <EmptyState
        icon={SearchX}
        title={t("common:notFound.title")}
        description={t("common:notFound.description")}
        action={
          <Button asChild>
            <Link to="/dashboard">
              <Home />
              {t("common:actions.backToDashboard")}
            </Link>
          </Button>
        }
      />
    </main>
  )
}

export const RouteErrorPage = () => {
  const { t } = useTranslation(["common"])
  usePageTitle(t("routeError.title"))
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <EmptyState
        title={t("common:routeError.title")}
        description={t("common:routeError.description")}
        action={
          <Button onClick={() => window.location.reload()}>{t("common:actions.reload")}</Button>
        }
      />
    </main>
  )
}
