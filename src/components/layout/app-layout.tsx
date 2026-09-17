import { useState } from "react"

import { Menu } from "lucide-react"
import { Outlet, useLocation, useNavigation } from "react-router"
import { useTranslation } from "react-i18next"

import { AppNavigation } from "@/components/layout/app-navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export const AppLayout = () => {
  const { t } = useTranslation(["common"])

  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const section = pathname.startsWith("/meals")
    ? t("common:navigation.meals")
    : pathname.startsWith("/profile")
      ? t("common:navigation.profile")
      : pathname.startsWith("/admin")
        ? t("common:navigation.admin")
        : t("common:navigation.dashboard")

  return (
    <div className="flex min-h-svh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary p-4 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        {t("common:navigation.skip")}
      </a>
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 overflow-y-auto border-r bg-card lg:block">
        <AppNavigation />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label={t("common:navigation.openMenu")}
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("common:navigation.menu")}</SheetTitle>
                  <SheetDescription>{t("common:navigation.menuDescription")}</SheetDescription>
                </SheetHeader>
                <AppNavigation onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="hidden md:inline">
                {t("common:navigation.workspace")}
                <span className="mx-2 text-border">/</span>
              </span>
              <span className="font-medium text-foreground">{section}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </header>
        {navigation.state === "loading" && (
          <p role="status" className="px-6 pt-4 text-sm text-muted-foreground">
            {t("common:navigation.openingPage")}
          </p>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl space-y-6 p-4 outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
