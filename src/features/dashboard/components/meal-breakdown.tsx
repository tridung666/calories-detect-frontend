import { useTranslation } from "react-i18next"

import type { DailyMealEntry } from "@/features/dashboard/types/daily-meal"
import { mealTypeInfo, sumNutrition } from "@/features/meals/lib/meal-utils"
import { mealTypes } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"

export const MealBreakdown = ({ entries }: { entries: DailyMealEntry[] }) => {
  const { t } = useTranslation(["dashboard", "meals"])
  const totalCalories = sumNutrition(entries.flatMap((entry) => entry.items)).calories

  return (
    <section
      aria-labelledby="meal-breakdown-title"
      className="min-w-0 overflow-hidden rounded-lg border bg-card"
    >
      <div className="border-b p-4 sm:px-5">
        <h2 id="meal-breakdown-title" className="text-sm font-semibold">
          {t("dashboard:breakdownTitle")}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t("dashboard:breakdownDescription")}
        </p>
      </div>
      <dl className="space-y-5 p-4 sm:p-5">
        {mealTypes.map((type) => {
          const label = t(mealTypeInfo[type].labelKey)
          const calories = sumNutrition(
            entries.filter((entry) => entry.meal.mealType === type).flatMap((entry) => entry.items),
          ).calories

          return (
            <div key={type}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                <dt id={`breakdown-${type}`} className="font-medium">
                  {label}
                </dt>
                <dd className="text-muted-foreground tabular-nums">
                  {formatNumber(calories)} {t("meals:units.kcal")}
                </dd>
              </div>
              {totalCalories > 0 ? (
                <meter
                  className="nutrition-meter"
                  min={0}
                  max={totalCalories}
                  value={calories}
                  aria-labelledby={`breakdown-${type}`}
                  aria-valuetext={t("dashboard:calorieShare", {
                    calories: formatNumber(calories),
                    total: formatNumber(totalCalories),
                  })}
                />
              ) : (
                <div aria-hidden="true" className="h-1.5 rounded-sm bg-muted" />
              )}
            </div>
          )
        })}
      </dl>
      <p className="border-t bg-muted/30 px-4 py-4 text-xs leading-relaxed text-muted-foreground sm:px-5">
        {t("dashboard:nutritionHint")}
      </p>
    </section>
  )
}
