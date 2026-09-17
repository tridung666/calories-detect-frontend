import { ArrowRight, Plus } from "lucide-react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { DailyMealEntry } from "@/features/dashboard/types/daily-meal"
import { mealTypeInfo, sumNutrition } from "@/features/meals/lib/meal-utils"
import type { MealType } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"

export const DailyMealCard = ({
  type,
  entries,
  onCreate,
}: {
  type: MealType
  entries: DailyMealEntry[]
  onCreate: (trigger: HTMLButtonElement) => void
}) => {
  const { t } = useTranslation(["common", "dashboard", "meals"])

  const { labelKey, icon: Icon } = mealTypeInfo[type]
  const label = t(labelKey)
  const nutrition = sumNutrition(entries.flatMap((entry) => entry.items))
  return (
    <section aria-labelledby={`meal-${type}`} className="min-w-0 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 id={`meal-${type}`} className="text-sm font-medium">
              {label}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {entries.length
                ? t("dashboard:foodSummary", {
                    count: entries.reduce((total, entry) => total + entry.items.length, 0),
                    calories: formatNumber(nutrition.calories),
                  })
                : t("dashboard:notLogged")}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-11 gap-1.5 px-3 text-muted-foreground sm:h-10"
          aria-label={t("dashboard:addMeal", { meal: label.toLowerCase() })}
          onClick={(event) => onCreate(event.currentTarget)}
        >
          <Plus aria-hidden="true" />
          {t("dashboard:add")}
        </Button>
      </div>
      {entries.length > 0 && (
        <ul className="mt-3 space-y-2 sm:ml-13">
          {entries.map(({ meal, items }) => {
            const names = items.map((item) => item.inputName).join(", ")

            return (
              <li key={meal.id}>
                <Link
                  to={`/meals/${meal.id}`}
                  className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <div className="min-w-0 space-y-1">
                    <p
                      className="line-clamp-2 font-medium wrap-anywhere"
                      title={names || undefined}
                    >
                      {items.length ? names : t("dashboard:addFoods")}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t("dashboard:foodSummary", {
                        count: items.length,
                        calories: formatNumber(sumNutrition(items).calories),
                      })}
                    </p>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
