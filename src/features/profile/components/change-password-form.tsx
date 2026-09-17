import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MutationError } from "@/components/ui/feedback"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { useChangePassword } from "@/features/auth/hooks/use-auth-mutations"
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/features/auth/schemas/auth-schema"

export const ChangePasswordForm = () => {
  const { t } = useTranslation(["common", "profile"])

  const mutation = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmNewPassword: "" },
  })
  return (
    <Card className="rounded-lg">
      <CardHeader className="px-6">
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {t("profile:password.title")}
        </CardTitle>
        <CardDescription>{t("profile:password.description")}</CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <form
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values, { onSuccess: () => reset() }))}
        >
          <fieldset className="space-y-4" disabled={mutation.isPending}>
            <FormInput
              id="old-password"
              label={t("profile:password.current")}
              type="password"
              autoComplete="current-password"
              error={errors.oldPassword?.message}
              {...register("oldPassword")}
            />
            <FormInput
              id="new-password"
              label={t("profile:password.new")}
              type="password"
              autoComplete="new-password"
              hint={t("profile:password.hint")}
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <FormInput
              id="confirm-new-password"
              label={t("profile:password.confirm")}
              type="password"
              autoComplete="new-password"
              error={errors.confirmNewPassword?.message}
              {...register("confirmNewPassword")}
            />
          </fieldset>
          <MutationError error={mutation.error} />
          <SubmitButton pending={mutation.isPending} className="h-10">
            {t("profile:password.submit")}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
