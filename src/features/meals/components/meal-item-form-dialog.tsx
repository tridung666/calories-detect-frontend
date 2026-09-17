import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

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
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { useSaveMealItem } from "@/features/meals/hooks/use-meal-mutations"
import { mealItemSchema, type MealItemFormValues } from "@/features/meals/schemas/meal-schema"
import type { MealItem } from "@/features/meals/types/meal"

export const MealItemFormDialog = ({
  mealId,
  item,
  onClose,
}: {
  mealId: number
  item?: MealItem
  onClose: () => void
}) => {
  const { t } = useTranslation(["common", "meals"])

  const nutritionFields = [
    { name: "calories", label: t("meals:nutrition.caloriesWithUnit") },
    { name: "proteinGrams", label: t("meals:nutrition.proteinWithUnit") },
    { name: "carbohydrateGrams", label: t("meals:nutrition.carbohydratesWithUnit") },
    { name: "fatGrams", label: t("meals:nutrition.fatWithUnit") },
  ] as const

  const mutation = useSaveMealItem(mealId, item?.id)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MealItemFormValues>({
    resolver: zodResolver(mealItemSchema),
    defaultValues: item
      ? { ...item, normalizedName: item.normalizedName ?? "" }
      : {
          inputName: "",
          normalizedName: "",
          quantityGrams: 100,
          calories: 0,
          proteinGrams: 0,
          carbohydrateGrams: 0,
          fatGrams: 0,
        },
  })
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? t("meals:items.edit") : t("meals:items.add")}</DialogTitle>
          <DialogDescription>{t("meals:items.formDescription")}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit((values) =>
            mutation.mutate(
              {
                ...values,
                normalizedName: values.normalizedName || null,
              },
              { onSuccess: onClose },
            ),
          )}
        >
          <fieldset disabled={mutation.isPending} className="space-y-4">
            <FormInput
              id="item-name"
              label={t("meals:items.name")}
              placeholder={t("meals:items.namePlaceholder")}
              error={errors.inputName?.message}
              {...register("inputName")}
            />
            <FormInput
              id="item-normalized-name"
              label={t("meals:items.normalizedName")}
              placeholder={t("meals:items.normalizedPlaceholder")}
              error={errors.normalizedName?.message}
              {...register("normalizedName")}
            />
            <FormInput
              id="quantity"
              label={t("meals:items.quantity")}
              type="number"
              min="0.01"
              step="0.01"
              error={errors.quantityGrams?.message}
              {...register("quantityGrams", { valueAsNumber: true })}
            />
            <div className="grid grid-cols-2 gap-4">
              {nutritionFields.map(({ name, label }) => (
                <FormInput
                  key={name}
                  id={name}
                  label={label}
                  type="number"
                  min="0"
                  step="1"
                  error={errors[name]?.message}
                  {...register(name, { valueAsNumber: true })}
                />
              ))}
            </div>
          </fieldset>
          <MutationError error={mutation.error} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
              {t("common:actions.cancel")}
            </Button>
            <SubmitButton pending={mutation.isPending}>
              {item ? t("common:actions.saveChanges") : t("meals:items.add")}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
