import { useTranslation } from "react-i18next"
import { ScanLine } from "lucide-react"
import { Link } from "react-router"

export const Brand = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useTranslation(["common"])
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={t("common:brand.home")}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ScanLine aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight">{t("common:brand.name")}</p>
        {!compact && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("common:brand.tagline")}
          </p>
        )}
      </div>
    </Link>
  )
}
