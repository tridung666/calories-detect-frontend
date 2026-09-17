import { useTranslation } from "react-i18next"

import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "@/hooks/useTheme"

export const AppToaster = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <Toaster
      offset="72px"
      position="top-right"
      richColors
      theme={theme}
      containerAriaLabel={t("feedback.notifications")}
      toastOptions={{ closeButtonAriaLabel: t("feedback.closeNotification") }}
    />
  )
}
