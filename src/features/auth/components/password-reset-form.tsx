import { useRef } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { flushSync } from "react-dom"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { resetPasswordApi } from "@/features/auth/api/auth-api"
import { OtpInput } from "@/features/auth/components/otp-input"
import { usePasswordAction } from "@/features/auth/hooks/use-password-action"
import { clearPasswordResetSession } from "@/features/auth/lib/password-session"
import { passwordConfirmationSchema } from "@/features/auth/schemas/auth-schema"
import type { PasswordConfirmationValues } from "@/features/auth/types/auth"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/api-error"

export type PasswordResetFormProps = {
  email: string
  changeUserId?: number
  resend: () => Promise<boolean>
  pending: boolean
  seconds: number
  onBack: () => void
  onComplete: () => void
  noLocalPassword?: boolean
}

export const PasswordResetForm = ({
  email,
  changeUserId,
  resend,
  pending,
  seconds,
  onBack,
  onComplete,
  noLocalPassword,
}: PasswordResetFormProps) => {
  const { t } = useTranslation(["auth", "profile", "common"])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const action = usePasswordAction(resetPasswordApi)
  const resending = useRef(false)
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PasswordConfirmationValues>({
    resolver: zodResolver(passwordConfirmationSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  })
  const disabled =
    pending || action.pending || isSubmitting || noLocalPassword || action.error?.code === 11009
  const fieldCodes = [11003, 11006, 11012]
  return (
    <div className="space-y-5">
      <p className="text-sm wrap-anywhere">
        <span className="text-muted-foreground">{t("common:fields.email")}: </span>
        {email}
      </p>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          void handleSubmit(async (values) => {
            if (pending || action.pending || noLocalPassword || resending.current) return
            await action.run(
              { email, ...values },
              (error) => {
                const code = getApiErrorCode(error)
                const field =
                  code === 11003
                    ? "confirmPassword"
                    : code === 11006
                      ? "otp"
                      : code === 11012
                        ? "newPassword"
                        : undefined
                if (field)
                  setError(field, { message: getApiErrorMessage(error) }, { shouldFocus: true })
              },
              (active) => {
                // A completed reset must end the matching session even if the user left
                // while the request was pending. Only the active form redirects.
                if (active) {
                  reset()
                  onComplete()
                }
                flushSync(() => {
                  clearPasswordResetSession(queryClient, email, changeUserId)
                  if (active)
                    void navigate("/auth/login", {
                      replace: true,
                      state: { email, notice: "passwordChanged" },
                      flushSync: true,
                    })
                })
              },
            )
          })(event)
        }}
      >
        <fieldset disabled={disabled} className="space-y-4">
          <Controller
            name="otp"
            control={control}
            render={({ field }) => <OtpInput {...field} autoFocus error={errors.otp?.message} />}
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
            id="confirm-password"
            label={t("profile:password.confirm")}
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </fieldset>
        {action.error && !fieldCodes.includes(action.error.code ?? 0) && (
          <p role="alert" className="text-sm text-destructive">
            {action.error.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("profile:password.signOutNotice")}</p>
        <SubmitButton pending={action.pending} disabled={disabled} className="h-10 w-full">
          {t("profile:password.submit")}
        </SubmitButton>
      </form>
      <p className="text-xs text-muted-foreground">{t("auth:otp.limits")}</p>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || seconds > 0}
        onClick={async () => {
          if (disabled || seconds > 0 || resending.current) return
          resending.current = true
          clearErrors()
          action.clearError()
          try {
            await resend()
          } finally {
            resending.current = false
          }
        }}
      >
        {seconds > 0 ? t("auth:otp.resendIn", { seconds }) : t("auth:otp.resend")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={pending || action.pending || isSubmitting}
        onClick={() => {
          reset()
          onBack()
        }}
      >
        {t(changeUserId === undefined ? "auth:forgot.editEmail" : "profile:password.cancel")}
      </Button>
    </div>
  )
}
