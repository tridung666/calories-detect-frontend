import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { flushSync } from "react-dom"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { setPasswordApi } from "@/features/auth/api/auth-api"
import { usePasswordAction } from "@/features/auth/hooks/use-password-action"
import { clearPasswordResetSession } from "@/features/auth/lib/password-session"
import { setPasswordSchema } from "@/features/auth/schemas/auth-schema"
import type { SetPasswordRequest } from "@/features/auth/types/auth"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/api-error"

export const SetPasswordForm = ({ email, userId }: { email: string; userId: number }) => {
  const { t } = useTranslation(["profile", "auth"])
  const action = usePasswordAction(setPasswordApi)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordRequest>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })
  const exists = action.error?.code === 11013
  return (
    <Card className="rounded-lg" id="set-password">
      <CardHeader>
        <CardTitle>{t("profile:setPassword.title")}</CardTitle>
        <CardDescription>{t("profile:setPassword.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            if (exists) return
            await action.run(
              values,
              (error) => {
                const code = getApiErrorCode(error)
                if (code === 11003 || code === 11012)
                  setError(
                    code === 11003 ? "confirmPassword" : "newPassword",
                    { message: getApiErrorMessage(error) },
                    { shouldFocus: true },
                  )
              },
              (active) => {
                if (active) reset()
                flushSync(() => {
                  clearPasswordResetSession(queryClient, email, userId)
                  if (active)
                    void navigate("/auth/login", {
                      replace: true,
                      state: { email, notice: "passwordChanged" },
                      flushSync: true,
                    })
                })
              },
            )
          })}
        >
          <fieldset disabled={action.pending || exists} className="space-y-4">
            <FormInput
              id="initial-password"
              type="password"
              autoComplete="new-password"
              label={t("profile:setPassword.password")}
              hint={t("profile:password.hint")}
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <FormInput
              id="initial-password-confirm"
              type="password"
              autoComplete="new-password"
              label={t("profile:setPassword.confirm")}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </fieldset>
          <p className="text-xs text-muted-foreground">{t("profile:password.signOutNotice")}</p>
          {action.error && ![11003, 11012].includes(action.error.code ?? 0) && (
            <p role="alert" className="text-sm text-destructive">
              {action.error.message}
            </p>
          )}
          {exists ? (
            <Link
              className="text-sm text-primary hover:underline focus-visible:underline"
              to="/profile/change-password"
            >
              {t("profile:password.title")}
            </Link>
          ) : (
            <SubmitButton pending={action.pending} disabled={isSubmitting}>
              {t("profile:setPassword.submit")}
            </SubmitButton>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
