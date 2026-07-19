import { useEffect, useState, type ReactNode } from "react"

import {
  ThemeProviderContext,
  type Theme,
} from "@/components/theme-provider-context"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)

    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme
    }

    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    const systemThemeQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    )

    function applyTheme() {
      const resolvedTheme =
        theme === "system"
          ? systemThemeQuery.matches
            ? "dark"
            : "light"
          : theme

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)
    }

    applyTheme()

    if (theme !== "system") {
      return
    }

    systemThemeQuery.addEventListener("change", applyTheme)

    return () => {
      systemThemeQuery.removeEventListener("change", applyTheme)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
