const LEGACY_KEYS = ["accessToken", "refreshToken", "calories-detect:tokens"]
const LOGOUT_KEY = "calories-detect:logout"
let accessToken: string | null = null
let expiresAt: number | undefined
let sessionVersion = 0
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

export const removeLegacyTokens = () => {
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      for (const key of LEGACY_KEYS) window[storageName].removeItem(key)
    } catch {
      // Private browsing or storage policy must not prevent an in-memory session.
    }
  }
}

const clear = () => {
  sessionVersion += 1
  accessToken = null
  expiresAt = undefined
  removeLegacyTokens()
  notify()
}

export const tokenStorage = {
  getSessionVersion: () => sessionVersion,
  getAccessToken: () => accessToken,
  getExpiresAt: () => expiresAt,
  setAccessToken: (token: string, options?: { isRefresh?: boolean; expiresIn?: number }) => {
    if (!options?.isRefresh) sessionVersion += 1
    accessToken = token
    const ttl = options?.expiresIn
    expiresAt =
      typeof ttl === "number" && Number.isFinite(ttl) ? Date.now() + ttl * 1000 : undefined
    removeLegacyTokens()
    notify()
  },
  clearTokens: () => {
    clear()
    // This event contains no credentials. Storage events also reach suspended tabs.
    try {
      localStorage.setItem(LOGOUT_KEY, crypto.randomUUID())
    } catch {
      // BroadcastChannel is the fallback when storage is unavailable.
    }
    channel?.postMessage("logout")
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

let channel: BroadcastChannel | undefined
if (typeof window !== "undefined") {
  removeLegacyTokens()
  window.addEventListener("storage", (event) => {
    if (event.key === LOGOUT_KEY) clear()
  })
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(LOGOUT_KEY)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === "logout") clear()
    }
  }
}
