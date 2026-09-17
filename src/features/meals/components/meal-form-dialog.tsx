import type { RefObject } from "react"

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
import { FormInput, FormSelect } from "@/components/ui/form-field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { SubmitButton } from "@/components/ui/submit-button"
import { useSaveMeal } from "@/features/meals/hooks/use-meal-mutations"
import { mealTypeInfo } from "@/features/meals/lib/meal-utils"
import { mealSchema, type MealFormValues } from "@/features/meals/schemas/meal-schema"
import { mealTypes, type Meal, type MealType } from "@/features/meals/types/meal"
import { today } from "@/lib/format"

type MealFormDialogProps = {
  meal?: Meal
  initialDate?: string
  initialType?: MealType
  returnFocusRef?: RefObject<HTMLElement | null>
  onClose: () => void
  onSaved?: (meal: Meal) => void
}

// Mount a fresh dialog for each edit/create action so drafts never leak between meals.
export const MealFormDialog = ({
  meal,
  initialDate,
  initialType,
  returnFocusRef,
  onClose,
  onSaved,
}: MealFormDialogProps) => {
  const { t } = useTranslation(["common", "meals"])

  const mutation = useSaveMeal(meal?.id)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      mealDate: meal?.mealDate ?? initialDate ?? today(),
      mealType: meal?.mealType ?? initialType ?? "BREAKFAST",
    },
  })
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose()
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current?.isConnected) {
            event.preventDefault()
            returnFocusRef.current.focus()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{meal ? t("meals:editTitle") : t("meals:add")}</DialogTitle>
          <DialogDescription>{t("meals:formDescription")}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit((values) =>
            mutation.mutate(values, {
              onSuccess: (savedMeal) => {
                onClose()
                onSaved?.(savedMeal)
              },
            }),
          )}
        >
          <fieldset disabled={mutation.isPending} className="space-y-4">
            <FormInput
              id="meal-date"
              label={t("meals:date")}
              type="date"
              error={errors.mealDate?.message}
              {...register("mealDate")}
            />
            <FormSelect
              id="meal-type"
              label={t("meals:meal")}
              error={errors.mealType?.message}
              {...register("mealType")}
            >
              {mealTypes.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {t(mealTypeInfo[type].labelKey)}
                </NativeSelectOption>
              ))}
            </FormSelect>
          </fieldset>
          <MutationError error={mutation.error} />
          <DialogFooter className="max-sm:*:h-11">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
              {t("common:actions.cancel")}
            </Button>
            <SubmitButton pending={mutation.isPending}>
              {meal ? t("common:actions.saveChanges") : t("meals:create")}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
