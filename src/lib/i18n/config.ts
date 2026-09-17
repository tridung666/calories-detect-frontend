export const languageConfig = {
  vi: { label: "Tiếng Việt", locale: "vi-VN" },
  en: { label: "English", locale: "en-US" },
} as const

export type Language = keyof typeof languageConfig

export const supportedLanguages = Object.keys(languageConfig) as Language[]
export const defaultLanguage: Language = "vi"
export const fallbackLanguage: Language = "en"
export const languageStorageKey = "calories-detect-language"

export const resolveLanguage = (value: string | null | undefined): Language | undefined => {
  const normalized = value?.trim().replaceAll("_", "-").toLowerCase()
  if (!normalized) return undefined
  return (
    supportedLanguages.find((language) => language.toLowerCase() === normalized) ??
    supportedLanguages.find((language) => language.toLowerCase() === normalized.split("-")[0])
  )
}

export const detectLanguage = (
  storedLanguage: string | null,
  browserLanguages: readonly string[],
): Language =>
  resolveLanguage(storedLanguage) ??
  browserLanguages.map(resolveLanguage).find((language) => language !== undefined) ??
  defaultLanguage

export const getInitialLanguage = (): Language => {
  let storedLanguage: string | null = null
  try {
    storedLanguage = window.localStorage.getItem(languageStorageKey)
  } catch {
    // Storage may be unavailable in private browsing or outside the browser.
  }
  return detectLanguage(storedLanguage, typeof navigator === "undefined" ? [] : navigator.languages)
}

export const persistLanguage = (language: Language) => {
  try {
    window.localStorage.setItem(languageStorageKey, language)
  } catch {
    // Changing language still works for the current session without storage.
  }
}
