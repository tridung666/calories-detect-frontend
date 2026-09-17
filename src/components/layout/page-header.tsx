import type { ReactNode } from "react"

import { usePageTitle } from "@/hooks/use-page-title"

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) => {
  usePageTitle(title)
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight wrap-anywhere">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed wrap-anywhere text-muted-foreground">
          {description}
        </p>
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:*:flex-1">{action}</div>
      )}
    </div>
  )
}
