import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"

import { MutationError } from "@/components/ui/feedback"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { GoogleSignIn } from "@/features/auth/components/google-sign-in"
import { useLogin } from "@/features/auth/hooks/use-login"
import { getReturnTo } from "@/features/auth/lib/session"
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login-schema"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/api-error"
import { emailSchema } from "@/lib/validation"
import { notification } from "@/lib/notification"

export const LoginPage = () => {
  const { t } = useTranslation(["common", "auth"])

  const mutation = useLogin()
  const location = useLocation()
  const navigate = useNavigate()
  const notice: unknown = location.state?.notice
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailSchema.safeParse(location.state?.email).data ?? "", password: "" },
  })

  return (
    <AuthCard
      title={t("auth:login.title")}
      description={t("auth:login.description")}
      footer={
        <p>
          {t("auth:login.noAccount")}{" "}
          <Link className="font-medium text-primary hover:underline" to="/auth/register">
            {t("auth:login.registerLink")}
          </Link>
        </p>
      }
    >
      {(notice === "passwordChanged" || notice === "emailVerified") && (
        <p role="status" className="mb-5 text-sm text-primary">
          {t(notice === "emailVerified" ? "auth:verify.success" : "auth:login.passwordChanged")}
        </p>
      )}
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: () => {
              void navigate(getReturnTo(location.search), { replace: true })
            },
            onError: (error) => {
              if (getApiErrorCode(error) === 11005) {
                void navigate("/auth/verify-email", {
                  replace: true,
                  state: { email: values.email },
                })
                return
              }
              notification.error(getApiErrorMessage(error))
            },
          }),
        )}
      >
        <fieldset disabled={mutation.isPending} className="space-y-5">
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
            autoComplete="current-password"
            placeholder={t("auth:login.passwordPlaceholder")}
            error={errors.password?.message}
            {...register("password")}
          />
        </fieldset>
        <MutationError error={mutation.error} />
        <SubmitButton pending={mutation.isPending} className="h-10 w-full">
          {t("auth:login.submit")}
          <ArrowRight />
        </SubmitButton>
      </form>
      <Link className="mt-4 block text-sm text-primary hover:underline" to="/auth/forgot-password">
        {t("auth:forgot.link")}
      </Link>
      <GoogleSignIn />
    </AuthCard>
  )
}
