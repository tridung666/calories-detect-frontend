import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"

import { MutationError } from "@/components/ui/feedback"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { useRegister } from "@/features/auth/hooks/use-auth-mutations"
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas/auth-schema"
import { notification } from "@/lib/notification"
import { i18n } from "@/lib/i18n/i18n"

export const RegisterPage = () => {
  const { t } = useTranslation(["common", "auth"])

  const mutation = useRegister()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  })
  return (
    <AuthCard
      title={t("auth:register.title")}
      description={t("auth:register.description")}
      footer={
        <p>
          {t("auth:register.hasAccount")}{" "}
          <Link className="font-medium text-primary hover:underline" to="/auth/login">
            {t("auth:login.submit")}
          </Link>
        </p>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: () => {
              notification.success(i18n.t("auth:register.success"))
              void navigate("/auth/login")
            },
          }),
        )}
      >
        <fieldset disabled={mutation.isPending} className="space-y-4">
          <FormInput
            id="full-name"
            label={t("common:fields.fullName")}
            autoComplete="name"
            placeholder={t("common:fields.namePlaceholder")}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <FormInput
            id="email"
            label={t("common:fields.email")}
            type="email"
            autoComplete="email"
            placeholder={t("common:fields.emailPlaceholder")}
            error={errors.email?.message}
            {...register("email")}
          />
          <FormInput
            id="password"
            label={t("common:fields.password")}
            type="password"
            autoComplete="new-password"
            hint={t("common:fields.passwordHint")}
            error={errors.password?.message}
            {...register("password")}
          />
          <FormInput
            id="confirm-password"
            label={t("common:fields.confirmPassword")}
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </fieldset>
        <MutationError error={mutation.error} />
        <SubmitButton pending={mutation.isPending} className="h-10 w-full">
          {t("auth:register.title")}
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
