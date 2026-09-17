import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"

export const DashboardLoading = () => {
  const { t } = useTranslation(["common"])

  return (
    <div className="space-y-6" role="status" aria-label={t("common:feedback.loadingLabel")}>
      <span className="sr-only">{t("common:feedback.loading")}</span>
      <div aria-hidden="true" className="overflow-hidden rounded-lg border bg-card">
        <div className="flex justify-between border-b px-4 py-4 sm:px-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 p-4 sm:py-6 lg:px-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="grid items-start gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-lg border bg-card xl:col-span-2">
          <div className="space-y-2 border-b p-4 sm:p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 border-b p-4 last:border-0 sm:p-5">
              <Skeleton className="size-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40 max-w-full" />
              </div>
              <Skeleton className="h-10 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  )
}
