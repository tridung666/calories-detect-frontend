import { useEffect, type ReactNode } from "react"

import { I18nextProvider } from "react-i18next"

import { persistLanguage } from "@/lib/i18n/config"
import { getLanguage, i18n } from "@/lib/i18n/i18n"

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const syncLanguage = () => {
      const language = getLanguage()
      document.documentElement.lang = language
      document.documentElement.dir = i18n.dir(language)
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", i18n.t("common:brand.description"))
      persistLanguage(language)
    }

    syncLanguage()
    i18n.on("languageChanged", syncLanguage)
    return () => {
      i18n.off("languageChanged", syncLanguage)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
