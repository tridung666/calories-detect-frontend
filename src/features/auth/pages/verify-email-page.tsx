import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, Navigate, useLocation, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import { resendOtpApi, verifyEmailApi } from "@/features/auth/api/auth-api"
import { AuthCard } from "@/features/auth/components/auth-card"
import { OtpInput } from "@/features/auth/components/otp-input"
import { useOtpCooldown } from "@/features/auth/hooks/use-otp-cooldown"
import { usePasswordAction } from "@/features/auth/hooks/use-password-action"
import { verificationCooldownKey } from "@/features/auth/lib/verification"
import { emailVerificationSchema } from "@/features/auth/schemas/auth-schema"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/api-error"
import { notification } from "@/lib/notification"
import { emailSchema } from "@/lib/validation"

const EmailVerificationForm = ({ email }: { email: string }) => {
  const { t } = useTranslation(["auth", "common"])
  const navigate = useNavigate()
  const verification = usePasswordAction(verifyEmailApi)
  const resend = usePasswordAction(resendOtpApi)
  const cooldown = useOtpCooldown(verificationCooldownKey(email))
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<{ otp: string }>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { otp: "" },
  })
  const pending = verification.pending || resend.pending || isSubmitting

  return (
    <AuthCard
      title={t("auth:verify.title")}
      description={t("auth:verify.description")}
      footer={
        <Link className="text-primary hover:underline focus-visible:underline" to="/auth/login">
          {t("auth:forgot.backToLogin")}
        </Link>
      }
    >
      <p className="mb-5 text-sm wrap-anywhere">
        <span className="text-muted-foreground">{t("common:fields.email")}: </span>
        {email}
      </p>
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit(async ({ otp }) => {
          if (pending) return
          resend.clearError()
          await verification.run(
            { email, otp },
            (error) => {
              cooldown.handleRateLimit(error)
              if (getApiErrorCode(error) === 11006)
                setError("otp", { message: getApiErrorMessage(error) }, { shouldFocus: true })
            },
            (active) => {
              if (!active) return
              reset()
              notification.success(t("auth:verify.success"))
              void navigate("/auth/login", {
                replace: true,
                state: { email, notice: "emailVerified" },
              })
            },
          )
        })}
      >
        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <OtpInput {...field} autoFocus disabled={pending} error={errors.otp?.message} />
          )}
        />
        {verification.error && verification.error.code !== 11006 && (
          <p role="alert" className="text-sm text-destructive">
            {verification.error.message}
          </p>
        )}
        <SubmitButton pending={verification.pending} disabled={pending} className="h-10 w-full">
          {t("auth:verify.submit")}
        </SubmitButton>
      </form>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        disabled={pending || cooldown.seconds > 0}
        onClick={async () => {
          if (pending || cooldown.seconds > 0) return
          clearErrors()
          verification.clearError()
          if (await resend.run({ email }, cooldown.handleRateLimit)) {
            cooldown.restart()
            notification.success(t("auth:verify.resent"))
          }
        }}
      >
        {cooldown.seconds > 0
          ? t("auth:otp.resendIn", { seconds: cooldown.seconds })
          : t("auth:otp.resend")}
      </Button>
      {resend.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {resend.error.message}
        </p>
      )}
    </AuthCard>
  )
}

export const VerifyEmailPage = () => {
  const location = useLocation()
  const email = emailSchema.safeParse(location.state?.email)
  if (!email.success) return <Navigate to="/auth/register" replace />
  return <EmailVerificationForm key={email.data} email={email.data} />
}
