import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Plus } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MutationError } from "@/components/ui/feedback"
import { SubmitButton } from "@/components/ui/submit-button"
import { MealAnalysisItemFields } from "@/features/meals/components/meal-analysis-item-fields"
import { useConfirmMealAnalysis } from "@/features/meals/hooks/use-meal-analysis"
import {
  emptyReviewItem,
  predictionToReviewItem,
  reviewToConfirmation,
} from "@/features/meals/lib/meal-analysis"
import { sumNutrition } from "@/features/meals/lib/meal-utils"
import {
  mealAnalysisReviewSchema,
  type MealAnalysisReviewValues,
} from "@/features/meals/schemas/meal-schema"
import type { MealAnalysis } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"
import { getValidationMessage } from "@/lib/i18n/validation"

const finite = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0

export const MealAnalysisReviewDialog = ({
  open,
  analysis,
  existingCount,
  onClose,
  onSaved,
}: {
  open: boolean
  analysis: MealAnalysis
  existingCount: number
  onClose: () => void
  onSaved: () => void
}) => {
  const { t } = useTranslation(["common", "meals"])
  const { t: validation } = useTranslation("validation")
  const confirmation = useConfirmMealAnalysis(analysis.mealId)
  const form = useForm<MealAnalysisReviewValues>({
    resolver: zodResolver(mealAnalysisReviewSchema),
    defaultValues: { items: analysis.items.map(predictionToReviewItem) },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" })
  const rows = useWatch({ control: form.control, name: "items" })
  const total = sumNutrition(
    rows.map((row) => ({
      calories: finite(row.calories),
      proteinGrams: finite(row.protein),
      carbohydrateGrams: finite(row.carbohydrate),
      fatGrams: finite(row.fat),
    })),
  )
  const totals = [
    { label: t("meals:nutrition.caloriesWithUnit"), value: total.calories },
    { label: t("meals:nutrition.proteinWithUnit"), value: total.proteinGrams },
    { label: t("meals:nutrition.carbohydratesWithUnit"), value: total.carbohydrateGrams },
    { label: t("meals:nutrition.fatWithUnit"), value: total.fatGrams },
  ]
  const listError =
    form.formState.errors.items?.root?.message ?? form.formState.errors.items?.message
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !confirmation.isPending) onClose()
      }}
    >
      <DialogContent
        className="flex max-h-[90svh] max-w-[calc(100%_-_2rem)] flex-col sm:max-w-3xl"
        showCloseButton={!confirmation.isPending}
      >
        <DialogHeader className="pr-6">
          <DialogTitle>{t("meals:analysis.reviewTitle")}</DialogTitle>
          <DialogDescription>{t("meals:analysis.reviewDescription")}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit((values) => {
            if (!confirmation.isPending)
              confirmation.mutate(reviewToConfirmation(values), { onSuccess: onSaved })
          })}
        >
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <dl
              className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4"
              aria-label={t("meals:analysis.draftTotal")}
            >
              {totals.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">{formatNumber(value)}</dd>
                </div>
              ))}
            </dl>
            {existingCount > 0 && (
              <Alert>
                <CircleAlert />
                <AlertDescription>
                  {t("meals:analysis.replaceWarning", { count: existingCount })}
                </AlertDescription>
              </Alert>
            )}
            <fieldset disabled={confirmation.isPending} className="space-y-4">
              {fields.map((field, index) => (
                <MealAnalysisItemFields
                  key={field.id}
                  index={index}
                  form={form}
                  prediction={
                    field.sourceIndex === undefined ? undefined : analysis.items[field.sourceIndex]
                  }
                  onRemove={() => remove(index)}
                />
              ))}
              {!fields.length && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {t("meals:analysis.emptyReview")}
                </p>
              )}
              {listError && (
                <p role="alert" className="text-sm text-destructive">
                  {getValidationMessage(listError, validation)}
                </p>
              )}
              <Button type="button" variant="outline" onClick={() => append(emptyReviewItem())}>
                <Plus />
                {t("meals:analysis.addFood")}
              </Button>
            </fieldset>
            <MutationError error={confirmation.error} />
          </div>
          <DialogFooter className="mt-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={confirmation.isPending}
              onClick={onClose}
            >
              {t("common:actions.cancel")}
            </Button>
            <SubmitButton pending={confirmation.isPending} disabled={!fields.length}>
              {existingCount > 0 ? t("meals:analysis.replaceAndSave") : t("meals:analysis.save")}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
