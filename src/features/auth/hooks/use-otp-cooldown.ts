import { useEffect, useState } from "react"

import axios from "axios"

import { readCooldown, startCooldown } from "@/features/auth/lib/verification"
import { getApiErrorCode } from "@/lib/api/api-error"

export const useOtpCooldown = (key: string) => {
  const [deadline, setDeadline] = useState({ key, until: readCooldown(key) })
  const [now, setNow] = useState(() => Date.now())
  const until = deadline.key === key ? deadline.until : readCooldown(key)
  const seconds = Math.max(0, Math.ceil((until - now) / 1000))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const restart = (duration = 60, targetKey = key) => {
    setDeadline({ key: targetKey, until: startCooldown(targetKey, Math.max(60, duration)) })
    setNow(Date.now())
  }

  const handleRateLimit = (error: unknown) => {
    if (!axios.isAxiosError(error)) return
    if (error.response?.status !== 429 && getApiErrorCode(error) !== 11010) return
    const retryAfter = error.response?.headers["retry-after"]
    const numeric = Number(retryAfter)
    const duration = Number.isFinite(numeric)
      ? numeric
      : (Date.parse(String(retryAfter)) - Date.now()) / 1000
    restart(Number.isFinite(duration) && duration > 0 ? Math.ceil(duration) : 60)
  }

  return { seconds, restart, handleRateLimit }
}
