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
import { useCreateUser } from "@/features/admin/hooks/use-users"
import { adminUserSchema, type AdminUserFormValues } from "@/features/admin/schemas/user-schema"

export const CreateUserDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation(["common", "admin"])

  const mutation = useCreateUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "USER" },
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
          <DialogTitle>{t("admin:add")}</DialogTitle>
          <DialogDescription>{t("admin:createDescription")}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit((values) => mutation.mutate(values, { onSuccess: onClose }))}
        >
          <fieldset disabled={mutation.isPending} className="space-y-4">
            <FormInput
              id="user-name"
              label={t("common:fields.fullName")}
              autoComplete="name"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <FormInput
              id="user-email"
              label={t("common:fields.email")}
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormInput
              id="user-password"
              label={t("common:fields.password")}
              type="password"
              autoComplete="new-password"
              hint={t("common:fields.passwordHint")}
              error={errors.password?.message}
              {...register("password")}
            />
            <FormSelect
              id="user-role"
              label={t("common:fields.role")}
              error={errors.role?.message}
              hint={t("admin:roleHint")}
              {...register("role")}
            >
              <NativeSelectOption value="USER">{t("common:roles.USER")}</NativeSelectOption>
              <NativeSelectOption value="ADMIN">{t("common:roles.ADMIN")}</NativeSelectOption>
            </FormSelect>
          </fieldset>
          <MutationError error={mutation.error} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
              {t("common:actions.cancel")}
            </Button>
            <SubmitButton pending={mutation.isPending}>{t("admin:create")}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
