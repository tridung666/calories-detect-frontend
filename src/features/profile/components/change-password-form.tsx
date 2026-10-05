import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormInput } from "@/components/ui/form-field"
import { SubmitButton } from "@/components/ui/submit-button"
import { forgotPasswordApi, requestPasswordChangeApi } from "@/features/auth/api/auth-api"
import { PasswordResetForm } from "@/features/auth/components/password-reset-form"
import { useOtpCooldown } from "@/features/auth/hooks/use-otp-cooldown"
import { usePasswordAction } from "@/features/auth/hooks/use-password-action"
import { useSession } from "@/features/auth/hooks/use-session"
import { emailCooldownKey } from "@/features/auth/lib/verification"
import { requestPasswordChangeSchema } from "@/features/auth/schemas/auth-schema"
import type { RequestPasswordChangeRequest } from "@/features/auth/types/auth"
import { useProfile } from "@/features/profile/hooks/use-profile"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/api-error"
import { emailSchema } from "@/lib/validation"

export const ChangePasswordForm = () => {
  const { t } = useTranslation(["common", "profile", "auth"])
  const session = useSession()
  // Account changes remount the form and discard all credentials from the old account.
  return (
    <AccountPasswordForm
      key={session?.userId}
      userId={session?.userId}
      title={t("profile:password.title")}
    />
  )
}

const AccountPasswordForm = ({ userId, title }: { userId?: number; title: string }) => {
  const { t } = useTranslation(["common", "profile", "auth"])
  const profile = useProfile()
  const action = usePasswordAction(requestPasswordChangeApi)
  const resendAction = usePasswordAction(forgotPasswordApi)
  const [resent, setResent] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [profileError, setProfileError] = useState("")
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [noLocalPassword, setNoLocalPassword] = useState(false)
  const cooldown = useOtpCooldown(emailCooldownKey(email ?? profile.data?.email ?? ""))
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordChangeRequest>({
    resolver: zodResolver(requestPasswordChangeSchema),
    defaultValues: { currentPassword: "" },
  })
  const blocked = noLocalPassword
  const send = async () => {
    if (action.pending || loadingProfile || cooldown.seconds > 0 || blocked || !userId) return false
    let account = profile.data
    setProfileError("")
    if (!emailSchema.safeParse(account?.email).success) {
      setLoadingProfile(true)
      const result = await profile.refetch()
      setLoadingProfile(false)
      if (result.error) {
        setProfileError(getApiErrorMessage(result.error))
        return false
      }
      account = result.data
    }
    const parsed = emailSchema.safeParse(account?.email)
    if (!parsed.success) {
      setProfileError(t("profile:password.missingEmail"))
      return false
    }
    const success = await action.run({ currentPassword: getValues("currentPassword") }, (error) => {
      cooldown.handleRateLimit(error)
      if (getApiErrorCode(error) === 11002) {
        setEmail(null)
        setError("currentPassword", { message: getApiErrorMessage(error) }, { shouldFocus: true })
      }
      if (getApiErrorCode(error) === 11009) {
        reset()
        setNoLocalPassword(true)
      }
    })
    if (!success) return false
    cooldown.restart(60, emailCooldownKey(parsed.data))
    reset()
    setResent(false)
    setEmail(parsed.data)
    return true
  }
  return (
    <Card className="rounded-lg">
      <CardHeader className="px-6">
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>
          {t(email ? "profile:password.confirmDescription" : "profile:password.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6">
        {email ? (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              {t(resent ? "auth:forgot.notice" : "profile:password.codeSent")}
            </p>
            <PasswordResetForm
              email={email}
              changeUserId={userId}
              resend={async () => {
                if (cooldown.seconds > 0) return false
                if (!(await resendAction.run({ email }, cooldown.handleRateLimit))) return false
                cooldown.restart()
                setResent(true)
                return true
              }}
              seconds={cooldown.seconds}
              pending={action.pending || resendAction.pending || loadingProfile}
              noLocalPassword={blocked}
              onBack={() => {
                reset()
                setEmail(null)
                action.clearError()
              }}
              onComplete={() => {
                reset()
                setEmail(null)
              }}
            />
          </>
        ) : (
          <form
            noValidate
            className="space-y-5"
            onSubmit={handleSubmit(async () => {
              await send()
            })}
          >
            <fieldset disabled={action.pending || loadingProfile || blocked}>
              <FormInput
                id="current-password"
                label={t("profile:password.current")}
                type="password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
            </fieldset>
            <SubmitButton
              pending={action.pending || resendAction.pending || loadingProfile}
              disabled={isSubmitting || cooldown.seconds > 0 || blocked}
              className="h-10"
            >
              {cooldown.seconds > 0
                ? t("auth:otp.resendIn", { seconds: cooldown.seconds })
                : t("profile:password.request")}
            </SubmitButton>
          </form>
        )}
        {action.error && action.error.code !== 11002 && (
          <p role="alert" className="text-sm text-destructive">
            {action.error.message}
          </p>
        )}
        {resendAction.error && (
          <p role="alert" className="text-sm text-destructive">
            {resendAction.error.message}
          </p>
        )}
        {blocked && (
          <Link
            className="text-sm text-primary hover:underline focus-visible:underline"
            to="/settings#set-password"
          >
            {t("profile:setPassword.title")}
          </Link>
        )}
        {profileError && (
          <div role="alert" className="space-y-2 text-sm text-destructive">
            <p>{profileError}</p>
            <Button
              variant="outline"
              disabled={profile.isFetching}
              onClick={() => void profile.refetch()}
            >
              {t("common:actions.retry")}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("profile:password.localOnly")}</p>
      </CardContent>
    </Card>
  )
}
