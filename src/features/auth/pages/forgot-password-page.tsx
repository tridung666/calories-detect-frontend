import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { forgotPasswordApi } from "@/features/auth/api/auth-api"
import { AuthCard } from "@/features/auth/components/auth-card"
import { PasswordResetForm } from "@/features/auth/components/password-reset-form"
import { useOtpCooldown } from "@/features/auth/hooks/use-otp-cooldown"
import { usePasswordAction } from "@/features/auth/hooks/use-password-action"
import { emailCooldownKey } from "@/features/auth/lib/verification"
import { forgotPasswordSchema } from "@/features/auth/schemas/auth-schema"
import type { ForgotPasswordRequest } from "@/features/auth/types/auth"

export const ForgotPasswordPage = () => {
  const { t } = useTranslation(["auth", "common", "profile"])
  const [email, setEmail] = useState<string | null>(null)
  const action = usePasswordAction(forgotPasswordApi)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })
  const inputEmail = useWatch({ control, name: "email" })
  const cooldown = useOtpCooldown(emailCooldownKey(email ?? inputEmail))
  const send = async (values: ForgotPasswordRequest) => {
    if (action.pending || cooldown.seconds > 0) return false
    if (!(await action.run(values, cooldown.handleRateLimit))) return false
    cooldown.restart()
    setEmail(values.email)
    return true
  }
  return (
    <AuthCard
      title={t("auth:forgot.title")}
      description={t("auth:forgot.description")}
      footer={
        <Link className="text-primary hover:underline focus-visible:underline" to="/auth/login">
          {t("auth:forgot.backToLogin")}
        </Link>
      }
    >
      {email === null ? (
        <form
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(async (values) => {
            await send(values)
          })}
        >
          <FormInput
            id="email"
            label={t("common:fields.email")}
            type="email"
            autoComplete="email"
            autoFocus
            disabled={action.pending}
            error={errors.email?.message}
            {...register("email")}
          />
          <SubmitButton
            className="h-10 w-full"
            pending={action.pending}
            disabled={isSubmitting || cooldown.seconds > 0}
          >
            {cooldown.seconds > 0
              ? t("auth:otp.resendIn", { seconds: cooldown.seconds })
              : t("profile:password.request")}
          </SubmitButton>
        </form>
      ) : (
        <>
          <p role="status" className="mb-5 text-sm text-muted-foreground">
            {t("auth:forgot.notice")}
          </p>
          <PasswordResetForm
            email={email}
            resend={() => send({ email })}
            seconds={cooldown.seconds}
            pending={action.pending}
            onBack={() => {
              setEmail(null)
              action.clearError()
            }}
            onComplete={() => setEmail(null)}
          />
        </>
      )}
      {action.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {action.error.message}
        </p>
      )}
    </AuthCard>
  )
}
