import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { MutationError } from "@/components/ui/feedback"
import { Separator } from "@/components/ui/separator"
import { useGoogleLogin } from "@/features/auth/hooks/use-auth-mutations"
import { loadGoogleIdentity } from "@/features/auth/lib/google-identity"

export const GoogleSignIn = () => {
  const { t, i18n } = useTranslation(["common", "auth"])
  const language = i18n.resolvedLanguage

  const container = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(false)
  const { mutate, isPending, error } = useGoogleLogin()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  useEffect(() => {
    if (!clientId) return
    let active = true
    const target = container.current
    void loadGoogleIdentity()
      .then((identity) => {
        if (!active || !target) return
        identity.initialize({
          client_id: clientId,
          auto_select: false,
          callback: ({ credential }) => {
            if (active) mutate(credential)
          },
        })
        identity.renderButton(target, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          locale: language ?? i18n.language,
        })
      })
      .catch(() => {
        if (active) setUnavailable(true)
      })
    return () => {
      active = false
      target?.replaceChildren()
    }
  }, [clientId, mutate, language, i18n])

  if (!clientId) return null
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{t("auth:google.or")}</span>
        <Separator className="flex-1" />
      </div>
      <div className="flex justify-center" ref={container} aria-busy={isPending} />
      {isPending && (
        <p role="status" className="text-center text-sm text-muted-foreground">
          {t("auth:google.pending")}
        </p>
      )}
      {unavailable && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("auth:google.unavailable")}
        </p>
      )}
      <MutationError error={error} />
    </div>
  )
}
