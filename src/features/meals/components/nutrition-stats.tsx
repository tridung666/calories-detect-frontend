import { Beef, Droplets, Flame, Wheat } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Card, CardContent } from "@/components/ui/card"
import type { Nutrition } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"

export const NutritionStats = ({ nutrition }: { nutrition: Nutrition }) => {
  const { t } = useTranslation(["common", "meals"])

  const stats = [
    {
      key: "calories",
      label: t("meals:nutrition.calories"),
      unit: t("meals:units.kcal"),
      icon: Flame,
      color: "bg-primary/10 text-primary",
    },
    {
      key: "proteinGrams",
      label: t("meals:nutrition.protein"),
      unit: t("meals:units.grams"),
      icon: Beef,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      key: "carbohydrateGrams",
      label: t("meals:nutrition.carbohydrates"),
      unit: t("meals:units.grams"),
      icon: Wheat,
      color: "bg-chart-3/10 text-chart-3",
    },
    {
      key: "fatGrams",
      label: t("meals:nutrition.fat"),
      unit: t("meals:units.grams"),
      icon: Droplets,
      color: "bg-chart-4/10 text-chart-4",
    },
  ] as const
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map(({ key, label, unit, icon: Icon, color }) => (
        <Card key={key} className="rounded-lg py-6">
          <CardContent className="space-y-4 px-4 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className={`rounded-lg p-2 ${color}`}>
                <Icon className="size-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
              {formatNumber(nutrition[key])}
              <span className="ml-2 text-sm font-normal text-muted-foreground">{unit}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
