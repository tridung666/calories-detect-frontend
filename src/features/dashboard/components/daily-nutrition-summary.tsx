import { useTranslation } from "react-i18next"

import type { Nutrition } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type DailyNutritionSummaryProps = {
  nutrition: Nutrition
  foodCount: number
}

export const DailyNutritionSummary = ({ nutrition, foodCount }: DailyNutritionSummaryProps) => {
  const { t } = useTranslation(["dashboard", "meals"])
  const nutrients = [
    { key: "calories", label: "calories", unit: "kcal" },
    { key: "proteinGrams", label: "protein", unit: "grams" },
    { key: "carbohydrateGrams", label: "carbohydrates", unit: "grams" },
    { key: "fatGrams", label: "fat", unit: "grams" },
  ] as const

  return (
    <section
      aria-labelledby="nutrition-summary-title"
      className="overflow-hidden rounded-lg border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-4 sm:px-6">
        <h2 id="nutrition-summary-title" className="text-sm font-semibold">
          {t("dashboard:nutritionSummary")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("dashboard:foodsRecorded", { count: foodCount })}
        </p>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {nutrients.map(({ key, label, unit }, index) => (
          <div
            key={key}
            className={cn(
              "min-w-0 px-4 py-5 sm:py-6 lg:px-6",
              index === 0 && "bg-muted/40",
              index % 2 === 1 && "border-l",
              index > 1 && "border-t sm:border-t-0 sm:border-l",
            )}
          >
            <dt className="text-xs font-medium text-muted-foreground">
              {t(`meals:nutrition.${label}`)}
            </dt>
            <dd className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span
                className={cn(
                  "min-w-0 text-2xl font-semibold tracking-tight break-all tabular-nums lg:text-3xl",
                  index === 0 && "text-primary",
                )}
              >
                {formatNumber(nutrition[key])}
              </span>{" "}
              <span className="text-xs text-muted-foreground">{t(`meals:units.${unit}`)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
