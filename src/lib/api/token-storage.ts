const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"
const SESSION_EVENT = "calories-detect:session"
let sessionVersion = 0

const notifySession = () => window.dispatchEvent(new Event(SESSION_EVENT))

export const tokenStorage = {
  getSessionVersion: () => sessionVersion,
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(accessToken: string, refreshToken: string, options?: { isRefresh: boolean }): void {
    if (!options?.isRefresh) sessionVersion += 1
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    notifySession()
  },

  clearTokens(): void {
    sessionVersion += 1
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    notifySession()
  },
  subscribe: (listener: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY || event.key === null) {
        sessionVersion += 1
        listener()
      }
    }
    window.addEventListener(SESSION_EVENT, listener)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(SESSION_EVENT, listener)
      window.removeEventListener("storage", onStorage)
    }
  },
}
