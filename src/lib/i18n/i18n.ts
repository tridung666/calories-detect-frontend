import { createInstance } from "i18next"
import { initReactI18next } from "react-i18next"

import {
  defaultLanguage,
  fallbackLanguage,
  getInitialLanguage,
  languageConfig,
  resolveLanguage,
  supportedLanguages,
} from "@/lib/i18n/config"
import { resources } from "@/lib/i18n/resources"

export const i18n = createInstance()

// Bundled resources initialize synchronously, so the first render has translated copy.
void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: fallbackLanguage,
  supportedLngs: supportedLanguages,
  load: "languageOnly",
  defaultNS: "common",
  ns: Object.keys(resources.en),
  initAsync: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
})

export const getLanguage = () => resolveLanguage(i18n.resolvedLanguage) ?? defaultLanguage

export const getLocale = () => languageConfig[getLanguage()].locale
