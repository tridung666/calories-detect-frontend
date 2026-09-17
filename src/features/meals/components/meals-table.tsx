import { ArrowUpRight, Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mealTypeInfo } from "@/features/meals/lib/meal-utils"
import type { Meal } from "@/features/meals/types/meal"
import { formatDate } from "@/lib/format"

export const MealsTable = ({
  meals,
  onEdit,
  onDelete,
}: {
  meals: Meal[]
  onEdit: (meal: Meal) => void
  onDelete: (meal: Meal) => void
}) => {
  const { t } = useTranslation(["common", "meals"])
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t("meals:meal")}</TableHead>
          <TableHead>{t("meals:date")}</TableHead>
          <TableHead className="pr-6 text-right">{t("common:fields.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meals.map((meal) => {
          const { labelKey, icon: Icon, className } = mealTypeInfo[meal.mealType]
          const label = t(labelKey)
          const actionLabel = { meal: label.toLowerCase(), date: formatDate(meal.mealDate) }
          return (
            <TableRow key={meal.id}>
              <TableCell className="py-4 pl-6">
                <Link
                  to={`/meals/${meal.id}`}
                  className="flex w-fit items-center gap-3 rounded-lg font-medium hover:text-primary"
                >
                  <span className={`rounded-lg p-2 ${className}`}>
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(meal.mealDate)}</TableCell>
              <TableCell className="pr-6">
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="ghost">
                    <Link to={`/meals/${meal.id}`} aria-label={t("meals:table.view", actionLabel)}>
                      <ArrowUpRight />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("meals:table.edit", actionLabel)}
                    onClick={() => onEdit(meal)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label={t("meals:table.delete", actionLabel)}
                    onClick={() => onDelete(meal)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
