import { useTranslation } from "react-i18next"

import { MutationError } from "@/components/ui/feedback"
import { Separator } from "@/components/ui/separator"
import { GoogleIdentityButton } from "@/features/auth/components/google-identity-button"
import { useGoogleLogin } from "@/features/auth/hooks/use-auth-mutations"

export const GoogleSignIn = () => {
  const { t } = useTranslation("auth")
  const action = useGoogleLogin()
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()) return null
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{t("google.or")}</span>
        <Separator className="flex-1" />
      </div>
      <GoogleIdentityButton onCredential={action.mutateAsync} />
      <MutationError error={action.error} />
    </div>
  )
}
