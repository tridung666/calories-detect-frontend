import { Pencil, Trash2 } from "lucide-react"
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
import type { MealItem } from "@/features/meals/types/meal"
import { formatNumber } from "@/lib/format"

export const MealItemsTable = ({
  items,
  onEdit,
  onDelete,
}: {
  items: MealItem[]
  onEdit: (item: MealItem) => void
  onDelete: (item: MealItem) => void
}) => {
  const { t } = useTranslation(["common", "meals"])
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t("meals:items.food")}</TableHead>
          <TableHead className="text-right">{t("meals:items.weight")}</TableHead>
          <TableHead className="text-right">{t("meals:units.kcal")}</TableHead>
          <TableHead className="text-right">{t("meals:nutrition.proteinShort")}</TableHead>
          <TableHead className="text-right">{t("meals:nutrition.carbohydratesWithUnit")}</TableHead>
          <TableHead className="text-right">{t("meals:nutrition.fatShort")}</TableHead>
          <TableHead className="pr-6 text-right">{t("common:fields.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="max-w-64 py-4 pl-6 whitespace-normal">
              <p className="font-medium wrap-break-word">{item.inputName}</p>
              {item.normalizedName && (
                <p className="mt-1 text-xs text-muted-foreground wrap-break-word">
                  {item.normalizedName}
                </p>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {t("meals:items.grams", { value: formatNumber(item.quantityGrams) })}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatNumber(item.calories)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(item.proteinGrams)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(item.carbohydrateGrams)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(item.fatGrams)}</TableCell>
            <TableCell className="pr-6">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("common:actions.editNamed", { name: item.inputName })}
                  onClick={() => onEdit(item)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  aria-label={t("common:actions.deleteNamed", { name: item.inputName })}
                  onClick={() => onDelete(item)}
                >
                  <Trash2 />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
