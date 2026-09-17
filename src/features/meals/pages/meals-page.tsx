import { useState } from "react"

import { ListFilter, Plus, Utensils, X } from "lucide-react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataPagination } from "@/components/ui/data-pagination"
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/feedback"
import { FormInput, FormSelect } from "@/components/ui/form-field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { MealFormDialog } from "@/features/meals/components/meal-form-dialog"
import { MealsTable } from "@/features/meals/components/meals-table"
import { useMealFilters } from "@/features/meals/hooks/use-meal-filters"
import { useDeleteMeal } from "@/features/meals/hooks/use-meal-mutations"
import { useMeals } from "@/features/meals/hooks/use-meals"
import { mealTypeInfo } from "@/features/meals/lib/meal-utils"
import { mealTypes, type Meal } from "@/features/meals/types/meal"
import { formatDate } from "@/lib/format"

export const MealsPage = () => {
  const { t } = useTranslation(["common", "meals"])

  const { filters, setFilter, clearFilters, onPageChange } = useMealFilters()
  const query = useMeals(filters)
  const deletion = useDeleteMeal()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Meal | "new" | null>(null)
  const [deleting, setDeleting] = useState<Meal | null>(null)
  const hasFilters = Boolean(filters.mealDate || filters.mealType)

  return (
    <>
      <PageHeader
        title={t("common:navigation.meals")}
        description={t("meals:description")}
        action={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus />
            {t("meals:add")}
          </Button>
        }
      />
      <Card className="rounded-lg">
        <CardContent className="flex flex-wrap items-end gap-4">
          <ListFilter className="mb-3 hidden size-4 text-muted-foreground sm:block" />
          <FormInput
            id="filter-date"
            label={t("meals:date")}
            type="date"
            value={filters.mealDate ?? ""}
            onChange={(event) => setFilter("date", event.target.value)}
          />
          <FormSelect
            id="filter-type"
            label={t("meals:type")}
            value={filters.mealType ?? ""}
            onChange={(event) => setFilter("type", event.target.value)}
          >
            <NativeSelectOption value="">{t("meals:all")}</NativeSelectOption>
            {mealTypes.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {t(mealTypeInfo[type].labelKey)}
              </NativeSelectOption>
            ))}
          </FormSelect>
          {hasFilters && (
            <Button variant="ghost" className="h-10" onClick={clearFilters}>
              <X />
              {t("common:actions.clearFilters")}
            </Button>
          )}
        </CardContent>
      </Card>
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Card className="gap-0 rounded-lg p-0">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold">{t("meals:list")}</h2>
            <span className="text-xs text-muted-foreground">
              {t("meals:count", { count: query.data.totalElements })}
            </span>
          </div>
          {query.data.content.length ? (
            <MealsTable
              meals={query.data.content}
              onEdit={setEditing}
              onDelete={(meal) => {
                deletion.reset()
                setDeleting(meal)
              }}
            />
          ) : (
            <EmptyState
              icon={Utensils}
              title={hasFilters ? t("meals:empty.filteredTitle") : t("meals:empty.title")}
              description={
                hasFilters ? t("meals:empty.filteredDescription") : t("meals:empty.description")
              }
              action={
                <Button onClick={() => setEditing("new")}>
                  <Plus />
                  {t("meals:add")}
                </Button>
              }
            />
          )}
          <DataPagination {...query.data} disabled={query.isFetching} onChange={onPageChange} />
        </Card>
      )}
      {editing && (
        <MealFormDialog
          meal={editing === "new" ? undefined : editing}
          initialDate={filters.mealDate}
          initialType={filters.mealType}
          onClose={() => setEditing(null)}
          onSaved={editing === "new" ? (meal) => void navigate(`/meals/${meal.id}`) : undefined}
        />
      )}
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title={t("meals:delete.title")}
        description={t("meals:delete.description", { date: formatDate(deleting?.mealDate) })}
        pending={deletion.isPending}
        error={deletion.error}
        onConfirm={() => {
          if (deleting)
            deletion.mutate(deleting.id, {
              onSuccess: () => {
                setDeleting(null)
                if (query.data?.content.length === 1 && filters.page > 0)
                  onPageChange({ page: filters.page - 1, size: filters.size })
              },
            })
        }}
      />
    </>
  )
}
