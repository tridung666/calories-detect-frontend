import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { PageHeader } from "@/components/layout/page-header"
import { ChangePasswordForm } from "@/features/profile/components/change-password-form"

export const ConfirmPasswordChangePage = () => {
  const { t } = useTranslation(["profile", "common"])
  return (
    <>
      <PageHeader title={t("password.title")} description={t("password.description")} />
      <div className="max-w-lg">
        <ChangePasswordForm />
      </div>
      <Link
        className="mt-5 inline-block text-sm text-primary hover:underline focus-visible:underline"
        to="/settings"
      >
        {t("common:actions.backToSettings")}
      </Link>
    </>
  )
}
