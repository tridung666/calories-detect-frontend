import { useEffect } from "react"

import { useTranslation } from "react-i18next"

export const usePageTitle = (title: string) => {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = t("pageTitle", { title })
  }, [title, t])
}
