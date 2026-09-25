import { useState } from "react"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { linkGoogleApi } from "@/features/auth/api/auth-api"
import { GoogleIdentityButton } from "@/features/auth/components/google-identity-button"
import { usePasswordAction } from "@/features/auth/hooks/use-password-action"

export const GoogleLinkCard = ({ email, userId }: { email: string; userId: number }) => {
  const { t } = useTranslation("profile")
  const queryClient = useQueryClient()
  const action = usePasswordAction(linkGoogleApi)
  const [linked, setLinked] = useState(false)
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{t("google.title")}</CardTitle>
        <CardDescription className="wrap-anywhere">
          {t("google.description", { email })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linked ? (
          <p role="status" className="text-sm text-primary">
            {t("google.success")}
          </p>
        ) : (
          <GoogleIdentityButton
            onCredential={async (idToken) => {
              if (await action.run(idToken)) {
                setLinked(true)
                void queryClient.invalidateQueries({ queryKey: ["profile", userId] })
              }
            }}
          />
        )}
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error.code === 11007 ? t("google.conflict") : action.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
