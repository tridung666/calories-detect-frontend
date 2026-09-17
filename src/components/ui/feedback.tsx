import type { ReactNode } from "react"

import { CircleAlert, Inbox, RefreshCw, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/lib/api/api-error"

export const PageLoading = () => {
  const { t } = useTranslation(["common"])
  return (
    <div className="space-y-6" role="status" aria-label={t("common:feedback.loadingLabel")}>
      <span className="sr-only">{t("common:feedback.loading")}</span>
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export const EmptyState = ({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
}) => (
  <div className="flex flex-col items-center px-4 py-16 text-center">
    <div className="mb-4 rounded-full bg-muted p-4">
      <Icon className="size-6 text-muted-foreground" />
    </div>
    <h2 className="text-base font-semibold">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
)

export const ErrorState = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => {
  const { t } = useTranslation(["common"])
  return (
    <div className="rounded-lg border bg-card" role="alert">
      <EmptyState
        icon={CircleAlert}
        title={t("common:feedback.loadError")}
        description={getApiErrorMessage(error)}
        action={
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw />
              {t("common:actions.retry")}
            </Button>
          )
        }
      />
    </div>
  )
}

export const MutationError = ({ error }: { error: unknown }) => {
  useTranslation(["common"])
  return error ? (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
    </Alert>
  ) : null
}
