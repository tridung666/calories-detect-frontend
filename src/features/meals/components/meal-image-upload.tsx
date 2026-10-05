import { useState } from "react"

import { LoaderCircle, ScanLine } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { MutationError } from "@/components/ui/feedback"
import { ImageUpload } from "@/components/ui/image-upload"
import { MealAnalysisReviewDialog } from "@/features/meals/components/meal-analysis-review-dialog"
import { useAnalyzeMeal } from "@/features/meals/hooks/use-meal-analysis"
import { useDeleteMealImage, useUploadMealImage } from "@/features/meals/hooks/use-meal-mutations"
import type { Meal } from "@/features/meals/types/meal"

export const MealImageUpload = ({ meal, itemCount }: { meal: Meal; itemCount: number }) => {
  const { t } = useTranslation(["common", "meals"])
  const upload = useUploadMealImage(meal.id)
  const removal = useDeleteMealImage(meal.id)
  const analysis = useAnalyzeMeal(meal.id)
  const [hasSelection, setHasSelection] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const imagePending = upload.isPending || removal.isPending
  const canAnalyze = Boolean(meal.imageUrl) && !hasSelection && !imagePending && !analysis.isPending

  return (
    <>
      <Card className="rounded-lg">
        <CardHeader className="px-6">
          <CardTitle>{t("meals:image.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("meals:analysis.description")}</p>
        </CardHeader>
        <CardContent className="grid gap-6 px-6 lg:grid-cols-2">
          <ImageUpload
            label={t("meals:image.label")}
            currentUrl={meal.imageUrl}
            pending={imagePending}
            disabled={analysis.isPending}
            error={upload.error}
            onSelectionChange={setHasSelection}
            onReset={upload.reset}
            onUpload={(file, onSuccess) => upload.mutate(file, { onSuccess })}
            onRemove={() => {
              removal.reset()
              setRemoving(true)
            }}
            removeLabel={t("meals:image.remove")}
          />
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-semibold">{t("meals:analysis.title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("meals:analysis.hint")}
              </p>
            </div>
            {hasSelection ? (
              <p className="text-sm text-muted-foreground">{t("meals:analysis.uploadFirst")}</p>
            ) : (
              !meal.imageUrl && (
                <p className="text-sm text-muted-foreground">{t("meals:analysis.noImage")}</p>
              )
            )}
            {analysis.isPending && (
              <div role="status" className="flex gap-3 rounded-md bg-background p-3">
                <LoaderCircle
                  className="mt-0.5 size-4 shrink-0 animate-spin text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{t("meals:analysis.pending")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("meals:analysis.wait")}
                  </p>
                </div>
              </div>
            )}
            <MutationError error={analysis.error} />
            <div className="mt-auto flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!canAnalyze}
                onClick={() => analysis.start(() => setReviewOpen(true))}
              >
                <ScanLine />
                {analysis.isError ? t("meals:analysis.retry") : t("meals:analysis.analyze")}
              </Button>
              {analysis.isPending && (
                <Button type="button" variant="outline" onClick={analysis.cancel}>
                  {t("meals:analysis.cancel")}
                </Button>
              )}
              {analysis.data && !hasSelection && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={imagePending || analysis.isPending}
                  onClick={() => setReviewOpen(true)}
                >
                  {t("meals:analysis.reopen")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {analysis.data && (
        <MealAnalysisReviewDialog
          open={reviewOpen}
          analysis={analysis.data}
          existingCount={itemCount}
          onClose={() => setReviewOpen(false)}
          onSaved={() => {
            setReviewOpen(false)
            analysis.reset()
          }}
        />
      )}
      <ConfirmDeleteDialog
        open={removing}
        onOpenChange={setRemoving}
        title={t("meals:image.deleteTitle")}
        description={t("meals:image.deleteDescription")}
        pending={removal.isPending}
        error={removal.error}
        onConfirm={() => removal.mutate(undefined, { onSuccess: () => setRemoving(false) })}
      />
    </>
  )
}
