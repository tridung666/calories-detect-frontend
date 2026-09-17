import { useState } from "react"

import { ArrowLeft, Pencil, Plus, Utensils } from "lucide-react"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/feedback"
import { MealFormDialog } from "@/features/meals/components/meal-form-dialog"
import { MealItemFormDialog } from "@/features/meals/components/meal-item-form-dialog"
import { MealItemsTable } from "@/features/meals/components/meal-items-table"
import { NutritionStats } from "@/features/meals/components/nutrition-stats"
import { useDeleteMealItem } from "@/features/meals/hooks/use-meal-mutations"
import { useMeal, useMealItems } from "@/features/meals/hooks/use-meals"
import { mealTypeInfo, sumNutrition } from "@/features/meals/lib/meal-utils"
import type { MealItem } from "@/features/meals/types/meal"
import { formatDate } from "@/lib/format"

export const MealDetailPage = () => {
  const { t } = useTranslation(["common", "meals"])

  const id = Number(useParams().mealId)
  const meal = useMeal(id)
  const items = useMealItems(id)
  const deletion = useDeleteMealItem(id)
  const [editingMeal, setEditingMeal] = useState(false)
  const [editingItem, setEditingItem] = useState<MealItem | "new" | null>(null)
  const [deletingItem, setDeletingItem] = useState<MealItem | null>(null)

  if (!Number.isSafeInteger(id) || id <= 0)
    return (
      <EmptyState
        title={t("meals:detail.invalidTitle")}
        description={t("meals:detail.invalidDescription")}
        action={
          <Button asChild>
            <Link to="/meals">{t("meals:detail.back")}</Link>
          </Button>
        }
      />
    )
  if (meal.isPending || items.isPending) return <PageLoading />
  if (meal.isError || items.isError)
    return (
      <ErrorState
        error={meal.error ?? items.error}
        onRetry={() => {
          void meal.refetch()
          void items.refetch()
        }}
      />
    )

  return (
    <>
      <Button variant="ghost" asChild className="-ml-2 w-fit">
        <Link to="/meals">
          <ArrowLeft />
          {t("common:navigation.meals")}
        </Link>
      </Button>
      <PageHeader
        title={t(mealTypeInfo[meal.data.mealType].labelKey)}
        description={t("meals:detail.description", {
          date: formatDate(meal.data.mealDate),
          count: items.data.length,
        })}
        action={
          <>
            <Button variant="outline" size="lg" onClick={() => setEditingMeal(true)}>
              <Pencil />
              {t("meals:edit")}
            </Button>
            <Button size="lg" onClick={() => setEditingItem("new")}>
              <Plus />
              {t("meals:items.add")}
            </Button>
          </>
        }
      />
      <NutritionStats nutrition={sumNutrition(items.data)} />
      <Card className="gap-0 rounded-lg p-0">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">{t("meals:detail.foods")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("meals:detail.nutritionHint")}</p>
        </div>
        {items.data.length ? (
          <MealItemsTable
            items={items.data}
            onEdit={setEditingItem}
            onDelete={(item) => {
              deletion.reset()
              setDeletingItem(item)
            }}
          />
        ) : (
          <EmptyState
            icon={Utensils}
            title={t("meals:detail.emptyTitle")}
            description={t("meals:detail.emptyDescription")}
            action={
              <Button onClick={() => setEditingItem("new")}>
                <Plus />
                {t("meals:detail.firstFood")}
              </Button>
            }
          />
        )}
      </Card>
      {editingMeal && <MealFormDialog meal={meal.data} onClose={() => setEditingMeal(false)} />}
      {editingItem && (
        <MealItemFormDialog
          mealId={id}
          item={editingItem === "new" ? undefined : editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      <ConfirmDeleteDialog
        open={Boolean(deletingItem)}
        onOpenChange={() => setDeletingItem(null)}
        title={t("meals:items.deleteTitle")}
        description={t("meals:items.deleteDescription", { name: deletingItem?.inputName ?? "" })}
        pending={deletion.isPending}
        error={deletion.error}
        onConfirm={() => {
          if (deletingItem)
            deletion.mutate(deletingItem.id, { onSuccess: () => setDeletingItem(null) })
        }}
      />
    </>
  )
}
