import { useState } from "react"

import { Plus, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataPagination } from "@/components/ui/data-pagination"
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/feedback"
import { CreateUserDialog } from "@/features/admin/components/create-user-dialog"
import { UsersTable } from "@/features/admin/components/users-table"
import { useUsers } from "@/features/admin/hooks/use-users"
import { useListParams } from "@/hooks/use-list-params"

export const UsersPage = () => {
  const { t } = useTranslation(["common", "admin"])

  const { page, size, onPageChange } = useListParams()
  const query = useUsers({ page, size })
  const [creating, setCreating] = useState(false)
  return (
    <>
      <PageHeader
        title={t("admin:title")}
        description={t("admin:description")}
        action={
          <Button size="lg" onClick={() => setCreating(true)}>
            <Plus />
            {t("admin:add")}
          </Button>
        }
      />
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Card className="gap-0 rounded-lg p-0">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold">{t("admin:all")}</h2>
            <span className="text-xs text-muted-foreground">
              {t("admin:count", { count: query.data.totalElements })}
            </span>
          </div>
          {query.data.content.length ? (
            <UsersTable users={query.data.content} />
          ) : (
            <EmptyState
              icon={Users}
              title={t("admin:emptyTitle")}
              description={t("admin:emptyDescription")}
            />
          )}
          <DataPagination {...query.data} disabled={query.isFetching} onChange={onPageChange} />
        </Card>
      )}
      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
    </>
  )
}
