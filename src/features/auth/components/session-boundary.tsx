import { useEffect, useState, type ReactNode } from "react"
import axios from "axios"

import { ErrorState, PageLoading } from "@/components/ui/feedback"
import { isSessionRejected } from "@/lib/api/refresh-token"
import { tokenStorage } from "@/lib/api/token-storage"
import { refreshAccessToken } from "@/lib/axios"

export const SessionBoundary = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<{ ready: boolean; error?: unknown }>({ ready: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    void refreshAccessToken().then(
      () => {
        if (active) setState({ ready: true })
      },
      (error: unknown) => {
        if (active)
          setState(
            isSessionRejected(error) || axios.isCancel(error)
              ? { ready: true }
              : { ready: false, error },
          )
      },
    )
    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      const expiry = tokenStorage.getExpiresAt()
      if (!tokenStorage.getAccessToken() || expiry === undefined) return
      timer = setTimeout(
        () => {
          // On transient failure, the next API request retries. Avoid a background retry loop.
          void refreshAccessToken().catch(() => undefined)
        },
        Math.max(1000, expiry - Date.now() - 30_000),
      )
    }
    schedule()
    const unsubscribe = tokenStorage.subscribe(schedule)
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  if (state.error)
    return (
      <ErrorState
        error={state.error}
        onRetry={() => {
          setState({ ready: false })
          setAttempt((value) => value + 1)
        }}
      />
    )
  if (!state.ready) return <PageLoading />
  return children
}
