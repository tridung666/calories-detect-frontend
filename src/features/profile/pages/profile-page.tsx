import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState, PageLoading } from "@/components/ui/feedback"
import { ChangePasswordForm } from "@/features/profile/components/change-password-form"
import { useProfile } from "@/features/profile/hooks/use-profile"
import { formatDate, getInitials } from "@/lib/format"

export const ProfilePage = () => {
  const { t } = useTranslation(["common", "profile"])

  const query = useProfile()
  if (query.isPending) return <PageLoading />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  const profile = query.data
  return (
    <>
      <PageHeader title={t("common:navigation.profile")} description={t("profile:description")} />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader className="px-6">
            <CardTitle>{t("profile:personalInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                {getInitials(profile.fullName)}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold wrap-break-word">{profile.fullName}</h2>
                <Badge className="mt-2" variant="secondary">
                  <ShieldCheck />
                  {profile.role === "ADMIN" ? t("common:roles.ADMIN") : t("common:roles.USER")}
                </Badge>
              </div>
            </div>
            <dl className="divide-y">
              {[
                { label: t("common:fields.email"), value: profile.email },
                {
                  label: t("common:fields.status"),
                  value:
                    profile.status === "ACTIVE" ? t("profile:active") : t("common:status.inactive"),
                },
                { label: t("profile:joinedAt"), value: formatDate(profile.createdAt) },
                { label: t("profile:updatedAt"), value: formatDate(profile.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-wrap justify-between gap-2 py-4 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium wrap-anywhere">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <ChangePasswordForm />
      </div>
    </>
  )
}
