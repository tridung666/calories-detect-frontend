import { useEffect, type ReactNode } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import axios from "axios"

import { LanguageProvider } from "@/app/providers/language-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { readSession } from "@/features/auth/lib/session"
import { tokenStorage } from "@/lib/api/token-storage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (axios.isCancel(error)) return false
        if (axios.isAxiosError(error) && error.response && error.response.status < 500) return false
        return failureCount < 1
      },
      staleTime: 30_000,
    },
    mutations: { retry: false },
  },
})

export const AppProviders = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    let userId = readSession(tokenStorage.getAccessToken())?.userId
    return tokenStorage.subscribe(() => {
      const nextUserId = readSession(tokenStorage.getAccessToken())?.userId
      if (userId !== nextUserId) {
        queryClient.clear()
        userId = nextUserId
      }
    })
  }, [])

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="calories-detect-theme">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </LanguageProvider>
  )
}
