import { Calculator, Trash2 } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-field"
import { scalePrediction } from "@/features/meals/lib/meal-analysis"
import {
  confirmedMealItemSchema,
  type MealAnalysisReviewValues,
} from "@/features/meals/schemas/meal-schema"
import type { MealPredictionItem } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"

export const MealAnalysisItemFields = ({
  index,
  form,
  prediction,
  onRemove,
}: {
  index: number
  form: UseFormReturn<MealAnalysisReviewValues>
  prediction?: MealPredictionItem
  onRemove: () => void
}) => {
  const { t } = useTranslation(["common", "meals"])
  const {
    register,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = form
  const error = errors.items?.[index]
  const fields = [
    { name: "calories", label: t("meals:nutrition.caloriesWithUnit") },
    { name: "protein", label: t("meals:nutrition.proteinWithUnit") },
    { name: "carbohydrate", label: t("meals:nutrition.carbohydratesWithUnit") },
    { name: "fat", label: t("meals:nutrition.fatWithUnit") },
  ] as const

  const scale = () => {
    const quantity = getValues(`items.${index}.quantityGrams`)
    if (!prediction || !confirmedMealItemSchema.shape.quantityGrams.safeParse(quantity).success) {
      void trigger(`items.${index}.quantityGrams`)
      return
    }
    const nutrition = scalePrediction(prediction, quantity)
    fields.forEach(({ name }) =>
      setValue(`items.${index}.${name}`, nutrition[name], {
        shouldDirty: true,
        shouldValidate: true,
      }),
    )
  }

  return (
    <section
      className="space-y-4 rounded-lg border p-4"
      aria-label={t("meals:analysis.foodNumber", { number: index + 1 })}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">
            {t("meals:analysis.foodNumber", { number: index + 1 })}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {prediction
              ? t("meals:analysis.confidence", { value: formatNumber(prediction.confidence * 100) })
              : t("meals:analysis.manualFood")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("meals:analysis.removeFood", { number: index + 1 })}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FormInput
          id={`prediction-${index}-name`}
          label={t("meals:items.name")}
          error={error?.name?.message}
          {...register(`items.${index}.name`)}
        />
        <FormInput
          id={`prediction-${index}-quantity`}
          label={t("meals:items.quantity")}
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          error={error?.quantityGrams?.message}
          {...register(`items.${index}.quantityGrams`, { valueAsNumber: true })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {fields.map(({ name, label }) => (
          <FormInput
            key={name}
            id={`prediction-${index}-${name}`}
            label={label}
            type="number"
            min="0"
            max="2147483647"
            step="0.01"
            error={error?.[name]?.message}
            {...register(`items.${index}.${name}`, { valueAsNumber: true })}
          />
        ))}
      </div>
      {prediction && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={scale}
          className="h-auto min-h-8 whitespace-normal text-left"
        >
          <Calculator />
          {t("meals:analysis.scale")}
        </Button>
      )}
    </section>
  )
}
