import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/layout/page-header"
import { ErrorState, PageLoading } from "@/components/ui/feedback"
import { ChangePasswordForm } from "@/features/profile/components/change-password-form"
import { GoogleLinkCard } from "@/features/profile/components/google-link-card"
import { SetPasswordForm } from "@/features/profile/components/set-password-form"
import { useProfile } from "@/features/profile/hooks/use-profile"

export const SettingsPage = () => {
  const { t } = useTranslation(["common", "profile"])
  const query = useProfile()

  if (query.isPending) return <PageLoading />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />

  const profile = query.data
  return (
    <>
      <PageHeader
        title={t("common:navigation.settings")}
        description={t("profile:settingsDescription")}
      />
      <div key={profile.id} className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ChangePasswordForm />
          <SetPasswordForm email={profile.email} userId={profile.id} />
        </div>
        <GoogleLinkCard email={profile.email} userId={profile.id} />
      </div>
    </>
  )
}
