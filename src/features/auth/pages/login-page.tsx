import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { MutationError } from "@/components/ui/feedback"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { GoogleSignIn } from "@/features/auth/components/google-sign-in"
import { useLogin } from "@/features/auth/hooks/use-login"
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login-schema"

export const LoginPage = () => {
  const { t } = useTranslation(["common", "auth"])

  const mutation = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
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
      <GoogleSignIn />
    </AuthCard>
  )
}
