import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { loadGoogleIdentity } from "@/features/auth/lib/google-identity"

export const GoogleIdentityButton = ({
  onCredential,
}: {
  onCredential: (credential: string) => Promise<unknown>
}) => {
  const { t, i18n } = useTranslation(["auth", "common"])
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  const language = i18n.resolvedLanguage ?? i18n.language
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])
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
            if (!active || busy.current) return
            if (!credential.trim() || credential.length > 8192) {
              setUnavailable(true)
              return
            }
            busy.current = true
            setPending(true)
            void callback
              .current(credential)
              .catch(() => {
                // The calling action renders its localized API error.
              })
              .finally(() => {
                busy.current = false
                if (active) setPending(false)
              })
          },
        })
        identity.renderButton(target, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          locale: language,
        })
      })
      .catch(() => {
        if (active) setUnavailable(true)
      })
    return () => {
      active = false
      target?.replaceChildren()
    }
  }, [clientId, language, attempt])
  return (
    <div className="space-y-3">
      <div className="flex justify-center" ref={container} aria-busy={pending} />
      {pending && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("auth:google.pending")}
        </p>
      )}
      {(!clientId || unavailable) && (
        <div role="status" className="space-y-2 text-sm text-muted-foreground">
          <p>{t("auth:google.unavailable")}</p>
          {clientId && (
            <Button
              variant="outline"
              onClick={() => {
                setUnavailable(false)
                setAttempt((value) => value + 1)
              }}
            >
              {t("common:actions.retry")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
