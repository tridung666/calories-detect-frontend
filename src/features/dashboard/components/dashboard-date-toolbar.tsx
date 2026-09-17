import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { today } from "@/lib/format"
import { dateSchema } from "@/lib/validation"

type DashboardDateToolbarProps = {
  date: string
  isFetching: boolean
  onDateChange: (date: string) => void
  onToday: () => void
  onRefresh: () => void
}

export const DashboardDateToolbar = ({
  date,
  isFetching,
  onDateChange,
  onToday,
  onRefresh,
}: DashboardDateToolbarProps) => {
  const { t } = useTranslation(["common", "dashboard"])

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
      <div className="min-w-0 flex-1 space-y-2 sm:flex-none">
        <Label htmlFor="dashboard-date" className="text-xs text-muted-foreground">
          {t("dashboard:trackingDate")}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="dashboard-date"
            type="date"
            className="h-11 flex-1 bg-card sm:h-10 sm:w-auto sm:flex-none"
            value={date}
            onChange={(event) => {
              if (dateSchema.safeParse(event.target.value).success) onDateChange(event.target.value)
            }}
          />
          <Button
            variant="ghost"
            className="h-11 px-3 sm:h-10"
            disabled={date === today()}
            onClick={onToday}
          >
            {t("common:actions.today")}
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        className="size-11 gap-2 px-0 text-muted-foreground sm:h-10 sm:w-auto sm:px-3"
        aria-label={t("common:actions.refresh")}
        disabled={isFetching}
        onClick={onRefresh}
      >
        <RefreshCw aria-hidden="true" className={isFetching ? "animate-spin" : ""} />
        <span className="hidden sm:inline">{t("common:actions.refresh")}</span>
      </Button>
    </div>
  )
}
